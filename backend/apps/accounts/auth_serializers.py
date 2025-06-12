"""
Serializers customizados para autenticação
"""

from rest_framework import serializers
from django.contrib.auth import authenticate


class CustomAuthTokenSerializer(serializers.Serializer):
    """
    Serializer customizado para autenticação por email.
    Substitui o serializer padrão que usa username.
    """
    email = serializers.EmailField(
        label="Email",
        write_only=True,
        help_text="E-mail usado para login"
    )
    password = serializers.CharField(
        label="Password",
        style={'input_type': 'password'},
        trim_whitespace=False,
        write_only=True,
        help_text="Senha do usuário"
    )
    token = serializers.CharField(
        label="Token",
        read_only=True,
        help_text="Token de autenticação"
    )

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'),
                              username=email, password=password)

            if not user:
                msg = 'Não foi possível fazer login com as credenciais fornecidas.'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'É necessário fornecer "email" e "password".'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs 