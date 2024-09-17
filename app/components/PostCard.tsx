"use client";
import React, { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { Card, CardContent, Typography, Avatar, Box, IconButton, Button } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import EditPostForm from './EditPostForm';
import { Post } from '../types';
import { toast } from 'react-toastify';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  onPostUpdated: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdated }) => {
  const [liked, setLiked] = useState(post.userLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  const fetchLikeInfo = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/likes?postId=${post._id}&userId=${user.id}`);
      const data = await response.json();
      console.log(`Fetched like info for post ${post._id}:`, data);
      if (data.success) {
        setLiked(data.data.userLiked);
        setLikeCount(data.data.count);
        console.log(`Updated like state for post ${post._id}:`, { liked: data.data.userLiked, likeCount: data.data.count });
      }
    } catch (error) {
      console.error('Failed to fetch like info:', error);
    }
  }, [post._id, user?.id]);

  useEffect(() => {
    console.log(`PostCard mounted for post ${post._id}. Initial state:`, { liked, likeCount });
    fetchLikeInfo();
  }, [post._id, user?.id, fetchLikeInfo]);


  const handleLike = async () => {
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id, postId: post._id }),
      });
      const data = await response.json();
      console.log(`Like action response for post ${post._id}:`, data);
      if (data.success) {
        setLiked(data.liked);
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
        console.log(`Updated like state after action for post ${post._id}:`, { liked: data.liked, likeCount: data.liked ? likeCount + 1 : likeCount - 1 });
      } else {
        console.error('Failed to update like:', data.error);
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`/api/posts/${post._id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          toast.success('Deleted the post')
          onPostUpdated();
        } else {
          toast.error('Failed to delete, try again.')
          console.error('Failed to delete post');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleEditComplete = () => {
    setIsEditing(false);
    onPostUpdated();
  };

  if (isEditing) {
    return <EditPostForm post={post} onEditComplete={handleEditComplete} />;
  }

  return (
    <Card sx={{ marginBottom: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar 
            src={post.user.profilePicture} 
            sx={{ mr: 2 }}
          >
            {!post.user.profilePicture && post.user.name[0]}
          </Avatar>
          <Box>
            <Typography variant="h6">{post.user.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              @{post.user.username}
            </Typography>
          </Box>
        </Box>
        {isEditing ? (
          <EditPostForm post={post} onEditComplete={handleEditComplete} />
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {post.content}
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                {new Date(post.createdAt).toLocaleString()}
              </Typography>
              <Box display="flex" alignItems="center">
                <IconButton onClick={handleLike} color={liked ? "primary" : "default"}>
                  {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                <Typography variant="body2">{likeCount}</Typography>
              </Box>
            </Box>
          </>
        )}
        {user && user.id === post.user._id && !isEditing && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button startIcon={<EditIcon />} onClick={handleEdit} sx={{ mr: 1 }}>
              Edit
            </Button>
            <Button startIcon={<DeleteIcon />} onClick={handleDelete} color="error">
              Delete
            </Button>
          </Box>
        )}
        <CommentSection postId={post._id} />
      </CardContent>
    </Card>
  );
};

export default PostCard;