"""
Análise Arquitetural: Telefones
Avaliação BigInt vs CharField para armazenamento de telefones brasileiros

CONCLUSÃO: Manter CharField com validação aprimorada
"""

import re
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError


class PhoneAnalysis:
    """
    Análise comparativa de abordagens para telefones
    """
    
    def __init__(self):
        self.sample_phones = [
            "(11) 99999-9999",  # Celular SP
            "(85) 8888-8888",   # Fixo CE  
            "(21) 91234-5678",  # Celular RJ
            "(47) 3333-4444",   # Fixo SC
            "11999999999",      # Sem formatação
            "+5511999999999",   # Com código país
        ]
    
    def compare_approaches(self):
        """Compara abordagens BigInt vs CharField"""
        
        results = {
            'bigint_approach': self._analyze_bigint(),
            'charfield_approach': self._analyze_charfield(),
            'recommendation': self._get_recommendation()
        }
        
        return results
    
    def _analyze_bigint(self):
        """Análise da abordagem BigInt"""
        
        pros = [
            "Menor espaço de armazenamento (8 bytes vs ~20 chars)",
            "Indexação mais eficiente para buscas numéricas",
            "Validação automática de formato numérico",
            "Facilita comparações e ordenação"
        ]
        
        contras = [
            "PERDE formatação visual completamente",
            "Dificulta leitura humana nos dados",
            "Complicações com códigos internacionais (+55)",
            "Necessita formatação em TODA exibição",
            "Perda de contexto visual no banco de dados",
            "Dificuldade em debugging e queries manuais",
            "Não suporta extensões (ramais)"
        ]
        
        # Teste de conversão
        conversion_issues = []
        for phone in self.sample_phones:
            try:
                numeric = self._extract_numeric(phone)
                if len(str(numeric)) > 11:  # Telefone brasileiro max 11 dígitos
                    conversion_issues.append(f"Telefone {phone} → {numeric} (muito longo)")
            except Exception as e:
                conversion_issues.append(f"Erro convertendo {phone}: {e}")
        
        return {
            'pros': pros,
            'cons': contras,
            'conversion_issues': conversion_issues,
            'storage_size': '8 bytes',
            'human_readable': False,
            'formatting_required': True
        }
    
    def _analyze_charfield(self):
        """Análise da abordagem CharField"""
        
        pros = [
            "PRESERVA formatação visual",
            "Leitura humana facilitada",
            "Suporte a formatos diversos",
            "Facilita debugging e queries manuais",
            "Compatível com padrões internacionais",
            "Suporte a extensões e ramais",
            "Validação flexível via regex"
        ]
        
        contras = [
            "Maior espaço de armazenamento (~20 bytes)",
            "Indexação menos eficiente para busca numérica", 
            "Necessita validação customizada",
            "Possível inconsistência de formato"
        ]
        
        # Teste de validação
        validation_test = []
        validator = self._get_enhanced_phone_validator()
        
        for phone in self.sample_phones:
            try:
                validator(phone)
                validation_test.append(f"{phone} ✓ Válido")
            except ValidationError as e:
                validation_test.append(f"{phone} ✗ {e.message}")
        
        return {
            'pros': pros,
            'cons': contras,
            'validation_test': validation_test,
            'storage_size': '~20 bytes',
            'human_readable': True,
            'formatting_required': False
        }
    
    def _extract_numeric(self, phone):
        """Extrai apenas números do telefone"""
        numeric = re.sub(r'\D', '', phone)
        
        # Remove código do país se presente
        if numeric.startswith('55') and len(numeric) > 11:
            numeric = numeric[2:]
        
        return int(numeric) if numeric else 0
    
    def _get_enhanced_phone_validator(self):
        """Validador aprimorado para telefones brasileiros"""
        
        def validate_brazilian_phone(value):
            if not value:
                return
            
            # Remove espaços e caracteres especiais para validação
            clean_phone = re.sub(r'[^\d+]', '', value)
            
            # Padrões válidos
            patterns = [
                r'^\(\d{2}\)\s\d{4,5}-\d{4}$',           # (XX) XXXXX-XXXX
                r'^\d{2}\d{4,5}\d{4}$',                   # XXXXXXXXXXX  
                r'^\+55\d{2}\d{4,5}\d{4}$',              # +55XXXXXXXXXXX
                r'^\(\d{2}\)\s\d{4,5}-\d{4}\s*x\d+$',   # Com extensão
            ]
            
            # Verifica se corresponde a algum padrão
            for pattern in patterns:
                if re.match(pattern, value):
                    # Validações adicionais
                    numbers_only = re.sub(r'\D', '', value)
                    
                    # Remove código do país
                    if numbers_only.startswith('55'):
                        numbers_only = numbers_only[2:]
                    
                    # Verifica DDDs válidos (simplificado)
                    if len(numbers_only) >= 10:
                        ddd = numbers_only[:2]
                        valid_ddds = ['11', '12', '13', '14', '15', '16', '17', '18', '19',  # SP
                                     '21', '22', '24',  # RJ/ES
                                     '27', '28',        # ES
                                     '31', '32', '33', '34', '35', '37', '38',  # MG
                                     '41', '42', '43', '44', '45', '46',        # PR
                                     '47', '48', '49',  # SC
                                     '51', '53', '54', '55',  # RS
                                     '61',              # DF
                                     '62', '64',        # GO
                                     '63',              # TO
                                     '65', '66',        # MT
                                     '67',              # MS
                                     '68',              # AC
                                     '69',              # RO
                                     '71', '73', '74', '75', '77',  # BA
                                     '79',              # SE
                                     '81', '87',        # PE
                                     '82',              # AL
                                     '83',              # PB
                                     '84',              # RN
                                     '85', '88',        # CE
                                     '86', '89',        # PI
                                     '91', '93', '94',  # PA
                                     '92', '97',        # AM
                                     '95',              # RR
                                     '96',              # AP
                                     '98', '99']        # MA
                        
                        if ddd not in valid_ddds:
                            raise ValidationError(f'DDD {ddd} inválido')
                    
                    return  # Válido
            
            raise ValidationError(
                'Telefone deve estar em um formato válido: '
                '(XX) XXXXX-XXXX, (XX) XXXX-XXXX ou +55XXXXXXXXXXX'
            )
        
        return validate_brazilian_phone
    
    def _get_recommendation(self):
        """Recomendação final baseada na análise"""
        
        return {
            'approach': 'CharField com validação aprimorada',
            'reasoning': [
                'Preservação da formatação visual é crucial para UX',
                'Facilita manutenção e debugging',
                'Compatibilidade com padrões internacionais',
                'Diferença de performance insignificante para o volume esperado',
                'Flexibilidade para futuras extensões'
            ],
            'implementation': {
                'field_type': 'CharField',
                'max_length': 25,  # Para suportar extensões
                'validator': 'enhanced_phone_validator',
                'db_index': True,
                'help_text': 'Formato: (XX) XXXXX-XXXX ou +55XXXXXXXXXXX'
            },
            'migration_impact': 'Baixo - mantém estrutura atual',
            'performance_impact': 'Negligível para volume esperado'
        }


class EnhancedPhoneField:
    """
    Implementação do campo aprimorado de telefone
    """
    
    @staticmethod
    def get_validator():
        """Retorna validador aprimorado"""
        return RegexValidator(
            regex=r'^(\(\d{2}\)\s\d{4,5}-\d{4}|\d{10,11}|\+55\d{10,11})(\s*x\d+)?$',
            message='Telefone deve estar no formato: (XX) XXXXX-XXXX, XXXXXXXXXXX ou +55XXXXXXXXXXX. Extensão opcional: x1234'
        )
    
    @staticmethod
    def normalize_phone(phone):
        """Normaliza telefone para busca"""
        if not phone:
            return ""
        
        # Remove tudo exceto números
        normalized = re.sub(r'\D', '', phone)
        
        # Remove código do país se presente
        if normalized.startswith('55') and len(normalized) > 11:
            normalized = normalized[2:]
        
        return normalized
    
    @staticmethod
    def format_phone(phone):
        """Formata telefone para exibição"""
        if not phone:
            return ""
        
        # Se já está formatado, retorna como está
        if '(' in phone and ')' in phone:
            return phone
        
        # Normaliza primeiro
        normalized = EnhancedPhoneField.normalize_phone(phone)
        
        if len(normalized) == 10:
            # Telefone fixo: (XX) XXXX-XXXX
            return f"({normalized[:2]}) {normalized[2:6]}-{normalized[6:]}"
        elif len(normalized) == 11:
            # Celular: (XX) XXXXX-XXXX
            return f"({normalized[:2]}) {normalized[2:7]}-{normalized[7:]}"
        
        return phone  # Retorna original se não conseguir formatar


# Testes da implementação
def run_phone_analysis():
    """Executa análise completa dos telefones"""
    
    analysis = PhoneAnalysis()
    results = analysis.compare_approaches()
    
    print("=== ANÁLISE DE TELEFONES ===\n")
    
    print("BigInt Approach:")
    print("Prós:", results['bigint_approach']['pros'])
    print("Contras:", results['bigint_approach']['cons'])
    print("Issues:", results['bigint_approach']['conversion_issues'])
    print()
    
    print("CharField Approach:")
    print("Prós:", results['charfield_approach']['pros']) 
    print("Contras:", results['charfield_approach']['cons'])
    print("Testes:", results['charfield_approach']['validation_test'])
    print()
    
    print("RECOMENDAÇÃO:")
    rec = results['recommendation']
    print(f"Abordagem: {rec['approach']}")
    print("Justificativa:", rec['reasoning'])
    print("Implementação:", rec['implementation'])
    
    return results


if __name__ == "__main__":
    run_phone_analysis()