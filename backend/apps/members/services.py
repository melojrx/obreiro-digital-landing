import csv
import io
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from django.core.exceptions import ValidationError
from rest_framework import serializers

from apps.accounts.models import ChurchUser
from apps.branches.models import Branch
from .models import Member
from .serializers import MemberCreateSerializer


class MemberBulkImportService:
    """
    Service responsável por processar uploads em lote de membros via CSV.
    Centraliza parsing, normalização e reporte de erros.
    """

    MAX_ROWS = 1000
    MAX_FILE_SIZE_MB = 5
    SUPPORTED_ENCODINGS = ("utf-8-sig", "utf-8", "latin-1")

    def __init__(self, *, request, church, user, branch: Optional[Branch] = None):
        self.request = request
        self.church = church
        self.user = user
        self.branch = branch or self._get_default_branch()

    def _get_default_branch(self) -> Optional[Branch]:
        branch = ChurchUser.objects.get_active_branch_for_user(self.user)
        if branch and branch.church_id == self.church.id:
            return branch
        return (
            Branch.objects.filter(church=self.church, is_active=True)
            .order_by("-is_main", "name")
            .first()
        )

    def process_csv(self, *, uploaded_file, skip_duplicates: bool = True) -> Dict[str, Any]:
        self._validate_file(uploaded_file)
        content = self._decode_file(uploaded_file)
        reader = self._build_reader(content)

        total_rows = 0
        success_count = 0
        duplicates_skipped = 0
        created_ids: List[int] = []
        errors: List[Dict[str, Any]] = []

        for line_number, row in enumerate(reader, start=2):  # header = line 1
            if self._is_empty_row(row):
                continue

            total_rows += 1
            if total_rows > self.MAX_ROWS:
                raise serializers.ValidationError(
                    f"Arquivo excede o limite de {self.MAX_ROWS} linhas."
                )

            try:
                payload = self._build_member_payload(row)
            except ValidationError as exc:
                errors.append(
                    {"line": line_number, "messages": [str(exc.messages[0])]}
                )
                continue

            if skip_duplicates and self._is_duplicate(payload):
                duplicates_skipped += 1
                continue

            serializer = MemberCreateSerializer(
                data=payload, context={"request": self.request}
            )

            if serializer.is_valid():
                member = serializer.save()
                created_ids.append(member.id)
                success_count += 1
            else:
                errors.append(
                    {
                        "line": line_number,
                        "messages": self._flatten_serializer_errors(
                            serializer.errors
                        ),
                    }
                )

        return {
            "total_rows": total_rows,
            "success_count": success_count,
            "error_count": len(errors),
            "duplicates_skipped": duplicates_skipped,
            "errors": errors,
            "imported_member_ids": created_ids,
            "branch_id": self.branch.id if self.branch else None,
        }

    def _validate_file(self, uploaded_file):
        max_bytes = self.MAX_FILE_SIZE_MB * 1024 * 1024
        if uploaded_file.size > max_bytes:
            raise serializers.ValidationError(
                f"Arquivo excede o tamanho máximo de {self.MAX_FILE_SIZE_MB}MB."
            )

    def _decode_file(self, uploaded_file) -> str:
        uploaded_file.seek(0)
        raw = uploaded_file.read()
        for encoding in self.SUPPORTED_ENCODINGS:
            try:
                return raw.decode(encoding)
            except UnicodeDecodeError:
                continue
        raise serializers.ValidationError(
            "Não foi possível decodificar o arquivo. Utilize UTF-8 ou ISO-8859-1."
        )

    def _build_reader(self, content: str) -> csv.DictReader:
        sample = content[:1024]
        delimiter = ";"
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=";,")
            delimiter = dialect.delimiter
        except csv.Error:
            pass

        return csv.DictReader(io.StringIO(content), delimiter=delimiter)

    def _is_empty_row(self, row: Dict[str, Any]) -> bool:
        return not any((value or "").strip() for value in row.values())

    def _build_member_payload(self, row: Dict[str, Any]) -> Dict[str, Any]:
        full_name = (row.get("Nome Completo") or "").strip()
        if not full_name:
            raise ValidationError("Nome Completo é obrigatório.")

        birth_date = self._parse_date(row.get("Data Nascimento"))
        phone = self._format_phone(row.get("Telefone"))

        if not birth_date:
            raise ValidationError("Data de Nascimento é obrigatória.")
        if not phone:
            raise ValidationError("Telefone é obrigatório e deve incluir DDD.")

        cpf = self._format_cpf(row.get("CPF"))
        membership_date = self._parse_date(row.get("Data Membresia"))

        payload: Dict[str, Any] = {
            "church": self.church.id,
            "branch": self.branch.id if self.branch else None,
            "full_name": full_name,
            "birth_date": birth_date,
            "phone": phone,
            "email": self._clean_string(row.get("Email")),
            "cpf": cpf,
            "gender": self._map_gender(row.get("Genero")),
            "marital_status": self._map_marital_status(row.get("Estado Civil")),
            "ministerial_function": self._map_ministerial_function(
                row.get("Funcao Ministerial")
            ),
        }

        if membership_date:
            payload["membership_date"] = membership_date

        return payload

    def _parse_date(self, value: Optional[str]):
        if not value:
            return None
        value = value.strip()
        if not value:
            return None

        for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        raise ValidationError(f"Data inválida: {value}. Use DD/MM/AAAA.")

    def _format_cpf(self, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        digits = re.sub(r"\D", "", value)
        if not digits:
            return None
        if len(digits) != 11:
            raise ValidationError("CPF deve conter 11 dígitos.")
        return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"

    def _format_phone(self, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        digits = re.sub(r"\D", "", value)
        if len(digits) == 10:
            return f"({digits[:2]}) {digits[2:6]}-{digits[6:]}"
        if len(digits) == 11:
            return f"({digits[:2]}) {digits[2:7]}-{digits[7:]}"
        return None

    def _map_gender(self, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        normalized = value.strip().upper()
        mapping = {
            "M": "M",
            "MASCULINO": "M",
            "F": "F",
            "FEMININO": "F",
            "O": "O",
            "OUTRO": "O",
        }
        return mapping.get(normalized)

    def _map_marital_status(self, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        normalized = value.strip().lower()
        mapping = {
            "solteiro": "single",
            "solteira": "single",
            "solteiro(a)": "single",
            "casado": "married",
            "casada": "married",
            "casado(a)": "married",
            "divorciado": "divorced",
            "divorciada": "divorced",
            "viúvo": "widowed",
            "viuvo": "widowed",
            "viúva": "widowed",
            "viuva": "widowed",
            "viúvo(a)": "widowed",
            "viuvo(a)": "widowed",
        }
        return mapping.get(normalized, "other")

    def _map_ministerial_function(self, value: Optional[str]) -> str:
        if not value:
            return "member"
        normalized = value.strip().lower()
        mapping = {
            "membro": "member",
            "diácono": "deacon",
            "diacono": "deacon",
            "diaconisa": "deaconess",
            "presbítero": "elder",
            "presbitero": "elder",
            "evangelista": "evangelist",
            "pastor": "pastor",
            "missionário": "missionary",
            "missionario": "missionary",
            "líder": "leader",
            "lider": "leader",
            "cooperador": "cooperator",
            "auxiliar": "auxiliary",
        }
        return mapping.get(normalized, "member")

    def _clean_string(self, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        value = value.strip()
        return value or None

    def _flatten_serializer_errors(self, errors: Dict[str, Any]) -> List[str]:
        flattened: List[str] = []
        for field, messages in errors.items():
            if isinstance(messages, (list, tuple)):
                for message in messages:
                    flattened.append(f"{field}: {message}")
            else:
                flattened.append(f"{field}: {messages}")
        return flattened

    def _is_duplicate(self, payload: Dict[str, Any]) -> bool:
        cpf = payload.get("cpf")
        email = payload.get("email")
        birth_date = payload.get("birth_date")

        qs = Member.objects.filter(is_active=True)
        if cpf:
            filter_kwargs = {"cpf": cpf}
            if self.church.denomination_id:
                filter_kwargs["church__denomination_id"] = self.church.denomination_id
            else:
                filter_kwargs["church"] = self.church
            return qs.filter(**filter_kwargs).exists()

        if email and birth_date:
            return qs.filter(church=self.church, email=email, birth_date=birth_date).exists()

        return False
