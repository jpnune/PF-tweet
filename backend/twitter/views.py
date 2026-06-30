from rest_framework import viewsets, status, permissions, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Tweet, Like, Follow, Comment
from .serializers import UserSerializer, TweetSerializer, CommentSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer


class UserViewSet(viewsets.ModelViewSet):  # changed to ModelViewSet so updates can occur
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.all().exclude(id=self.request.user.id)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(username__icontains=search)
        return queryset

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        user = self.get_object()
        followers = Follow.objects.filter(following=user).select_related('follower')
        users = [f.follower for f in followers]
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        user = self.get_object()
        following = Follow.objects.filter(follower=user).select_related('following')
        users = [f.following for f in following]
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        user_to_follow = self.get_object()
        
        # Check if already following
        follow_rel = Follow.objects.filter(follower=request.user, following=user_to_follow)
        if follow_rel.exists():
            follow_rel.delete()
            return Response({"detail": "Deixou de seguir com sucesso.", "is_following": False}, status=status.HTTP_200_OK)
        else:
            Follow.objects.create(follower=request.user, following=user_to_follow)
            return Response({"detail": "Seguindo com sucesso.", "is_following": True}, status=status.HTTP_201_CREATED)


class TweetViewSet(viewsets.ModelViewSet):
    serializer_class = TweetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtra o feed (somente quem segue) apenas na ação 'list'
        if self.action == 'list':
            user = self.request.user
            following_users = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
            return Tweet.objects.filter(user_id__in=following_users).distinct()
        return Tweet.objects.all()


    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def global_feed(self, request):
        # Global feed: all tweets from everyone (useful for discovering/unauthenticated contexts)
        tweets = Tweet.objects.all()
        page = self.paginate_queryset(tweets)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(tweets, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        tweet = self.get_object()
        like_rel = Like.objects.filter(user=request.user, tweet=tweet)
        if like_rel.exists():
            like_rel.delete()
            return Response({"detail": "Descurtido com sucesso.", "has_liked": False, "likes_count": tweet.likes.count()}, status=status.HTTP_200_OK)
        else:
            Like.objects.create(user=request.user, tweet=tweet)
            return Response({"detail": "Curtido com sucesso.", "has_liked": True, "likes_count": tweet.likes.count()}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def retweet(self, request, pk=None):
        parent_tweet = self.get_object()
        # Retweet creates a new tweet pointing to parent
        content = request.data.get('content', '')
        retweet = Tweet.objects.create(
            user=request.user,
            content=content,
            parent=parent_tweet
        )
        serializer = self.get_serializer(retweet)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tweet_id = self.request.query_params.get('tweet', None)
        if tweet_id:
            return Comment.objects.filter(tweet_id=tweet_id)
        return Comment.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
