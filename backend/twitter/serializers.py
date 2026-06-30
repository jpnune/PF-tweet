from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Tweet, Like, Follow, Profile, Comment

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    is_following = serializers.SerializerMethodField()
    display_name = serializers.CharField(required=False, allow_blank=True)
    avatar_url = serializers.URLField(required=False, allow_blank=True)

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'is_following', 'display_name', 'avatar_url', 'followers_count', 'following_count']

    def create(self, validated_data):
        display_name = validated_data.pop('display_name', '')
        avatar_url = validated_data.pop('avatar_url', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        profile = user.profile
        profile.display_name = display_name
        profile.avatar_url = avatar_url
        profile.save()
        return user

    def update(self, instance, validated_data):
        display_name = validated_data.pop('display_name', None)
        avatar_url = validated_data.pop('avatar_url', None)
        
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        
        password = validated_data.get('password')
        if password:
            instance.set_password(password)
            
        instance.save()

        # update profile
        profile, created = Profile.objects.get_or_create(user=instance)
        if display_name is not None:
            profile.display_name = display_name
        if avatar_url is not None:
            profile.avatar_url = avatar_url
        profile.save()

        # update relation cache
        instance.profile = profile

        return instance

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        profile = getattr(instance, 'profile', None)
        ret['display_name'] = profile.display_name if profile else ''
        ret['avatar_url'] = profile.avatar_url if profile else ''
        return ret

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False

    def get_followers_count(self, obj):
        return Follow.objects.filter(following=obj).count()

    def get_following_count(self, obj):
        return Follow.objects.filter(follower=obj).count()


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'tweet', 'content', 'created_at']
        read_only_fields = ['user', 'created_at']


class TweetSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    retweets_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()
    parent_tweet = serializers.SerializerMethodField()

    class Meta:
        model = Tweet
        fields = ['id', 'user', 'content', 'created_at', 'parent', 'likes_count', 'retweets_count', 'comments_count', 'has_liked', 'parent_tweet']
        read_only_fields = ['user', 'created_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_retweets_count(self, obj):
        return Tweet.objects.filter(parent=obj).count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_has_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, tweet=obj).exists()
        return False

    def get_parent_tweet(self, obj):
        if obj.parent:
            return {
                "id": obj.parent.id,
                "username": obj.parent.user.username,
                "display_name": getattr(obj.parent.user, 'profile', None).display_name if getattr(obj.parent.user, 'profile', None) else '',
                "avatar_url": getattr(obj.parent.user, 'profile', None).avatar_url if getattr(obj.parent.user, 'profile', None) else '',
                "content": obj.parent.content,
                "created_at": obj.parent.created_at
            }
        return None
