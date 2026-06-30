from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Tweet, Like, Follow

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'is_following']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False


class TweetSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    retweets_count = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()
    parent_tweet = serializers.SerializerMethodField()

    class Meta:
        model = Tweet
        fields = ['id', 'user', 'content', 'created_at', 'parent', 'likes_count', 'retweets_count', 'has_liked', 'parent_tweet']
        read_only_fields = ['user', 'created_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_retweets_count(self, obj):
        return Tweet.objects.filter(parent=obj).count()

    def get_has_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, tweet=obj).exists()
        return False

    def get_parent_tweet(self, obj):
        if obj.parent:
            # Avoid infinite recursion by using a simple representation of the parent tweet
            return {
                "id": obj.parent.id,
                "username": obj.parent.user.username,
                "content": obj.parent.content,
                "created_at": obj.parent.created_at
            }
        return None
