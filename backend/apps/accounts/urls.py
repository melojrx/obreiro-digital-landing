from django.urls import path
from .views import (
    CustomAuthToken,
    my_churches,
    active_church,
    set_active_church,
    me,
    my_church,
    upload_avatar,
    update_personal_data,
    update_church_data,
    finalize_registration,
    update_user_role,
)

urlpatterns = [
    # Auth
    path('login/', CustomAuthToken.as_view(), name='login'),
    path('finalize-registration/', finalize_registration, name='finalize-registration'),

    # Users endpoints (compat com frontend)
    path('users/me/', me, name='me'),
    path('users/my_church/', my_church, name='my_church'),
    path('users/upload-avatar/', upload_avatar, name='upload-avatar'),
    path('users/update_personal_data/', update_personal_data, name='update-personal-data'),
    path('users/update_church_data/', update_church_data, name='update-church-data'),
    path('users/<int:user_id>/update-role/', update_user_role, name='update-user-role'),

    # Legacy/aux
    path('my-churches/', my_churches, name='my-churches'),
    path('active-church/', active_church, name='active-church'),
    path('set-active-church/', set_active_church, name='set-active-church'),
]

