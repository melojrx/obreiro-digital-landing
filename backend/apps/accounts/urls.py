from django.urls import path
from .views import (
    CustomAuthToken, 
    my_churches, 
    active_church, 
    set_active_church, 
    me, 
    my_church, 
    upload_avatar,
    finalize_registration
)

urlpatterns = [
    path('login/', CustomAuthToken.as_view(), name='login'),
    path('my-churches/', my_churches, name='my-churches'),
    path('active-church/', active_church, name='active-church'),
    path('set-active-church/', set_active_church, name='set-active-church'),
    path('finalize-registration/', finalize_registration, name='finalize-registration'),
]