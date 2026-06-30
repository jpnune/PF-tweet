from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import Tweet, Like, Follow

class TwitterAPITests(APITestCase):

    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username="user1", password="password123")
        self.user2 = User.objects.create_user(username="user2", password="password123")
        self.user3 = User.objects.create_user(username="user3", password="password123")
        
        # Authenticate user1 by default
        self.client.force_authenticate(user=self.user1)

    def test_user_registration(self):
        # Unauthenticate client to test registration
        self.client.force_authenticate(user=None)
        url = reverse('register')
        data = {
            "username": "newuser",
            "password": "securepassword",
            "email": "newuser@example.com"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username="newuser").count(), 1)

    def test_tweet_creation(self):
        url = reverse('tweet-list')
        data = {"content": "Olá, este é o meu primeiro tweet!"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Tweet.objects.filter(user=self.user1).count(), 1)
        self.assertEqual(response.data['content'], "Olá, este é o meu primeiro tweet!")

    def test_tweet_like_toggle(self):
        # Create a tweet by user2
        tweet = Tweet.objects.create(user=self.user2, content="Tweet do User 2")
        url = reverse('tweet-like', kwargs={'pk': tweet.id})
        
        # Like
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['has_liked'])
        self.assertEqual(response.data['likes_count'], 1)

        # Unlike
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['has_liked'])
        self.assertEqual(response.data['likes_count'], 0)

    def test_follow_toggle(self):
        url = reverse('user-follow', kwargs={'pk': self.user2.id})
        
        # Follow
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_following'])
        self.assertTrue(Follow.objects.filter(follower=self.user1, following=self.user2).exists())

        # Unfollow
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_following'])
        self.assertFalse(Follow.objects.filter(follower=self.user1, following=self.user2).exists())

    def test_feed_queryset(self):
        # Create tweets
        tweet_user1 = Tweet.objects.create(user=self.user1, content="Tweet de user1")
        tweet_user2 = Tweet.objects.create(user=self.user2, content="Tweet de user2")
        tweet_user3 = Tweet.objects.create(user=self.user3, content="Tweet de user3")

        # user1 follows user2, but not user3
        Follow.objects.create(follower=self.user1, following=self.user2)

        url = reverse('tweet-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Feed must contain user2's tweets (followed), but NOT user1's own or user3's tweets
        tweet_ids = [t['id'] for t in response.data]
        self.assertNotIn(tweet_user1.id, tweet_ids)
        self.assertIn(tweet_user2.id, tweet_ids)
        self.assertNotIn(tweet_user3.id, tweet_ids)

    def test_user_search(self):
        url = reverse('user-list')
        # Search for user2
        response = self.client.get(url, {'search': 'user2'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'user2')

    def test_profile_update(self):
        url = reverse('user-me')
        data = {
            "display_name": "User 1 Custom Name",
            "avatar_url": "https://example.com/avatar.jpg"
        }
        # Update profile
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['display_name'], "User 1 Custom Name")
        self.assertEqual(response.data['avatar_url'], "https://example.com/avatar.jpg")

    def test_comments(self):
        tweet = Tweet.objects.create(user=self.user2, content="Tweet para comentar")
        url = reverse('comment-list')
        
        # Create comment
        data = {
            "tweet": tweet.id,
            "content": "Esse é um comentário legal!"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], "Esse é um comentário legal!")

        # List comments
        response = self.client.get(url, {'tweet': tweet.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['content'], "Esse é um comentário legal!")
