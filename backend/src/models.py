import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class PlayerManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password) 
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

class Player(AbstractBaseUser, PermissionsMixin): 
    username = models.CharField(max_length=100, unique=True, primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = PlayerManager()

    def __str__(self):
        return self.username

class GameRoom(models.Model):
    room_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    players = models.JSONField(default=list)

    answer_word = models.CharField(max_length=5)
    max_turns = models.IntegerField(default=3)
    game_state = models.CharField(max_length=20, default='waiting')
    turn_number = models.IntegerField(default=0)
    current_turn_player_index = models.IntegerField(default=0)
    history = models.JSONField(default=list)    # player guess history

    winner = models.CharField(max_length=100, null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    def is_full(self):
        return len(self.players) >= 2