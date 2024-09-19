"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton, Avatar } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Link from 'next/link';

interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string; 
    username: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number, userLiked: boolean }>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { user } = useAuth();
  const [isPosting, setIsPosting] = useState(false);

  // Wrap fetchComments in useCallback
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      const data = await response.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  }, [postId]); // Add postId as a dependency

  // Wrap fetchCommentLikes in useCallback
  const fetchCommentLikes = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/likes?userId=${user?.id}`);
      const data = await response.json();
      if (data.success) {
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: { count: data.data.count, userLiked: data.data.userLiked }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch comment likes:', error);
    }
  }, [user?.id]); // Add user?.id as a dependency

  useEffect(() => {
    fetchComments();
  }, [postId, fetchComments]); // Add fetchComments to the dependency array

  useEffect(() => {
    // Fetch initial like status and count for each comment
    comments.forEach(comment => fetchCommentLikes(comment._id));
  }, [comments, fetchCommentLikes]); // Add fetchCommentLikes to the dependency array

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to comment.');
      return;
    }
    setIsPosting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content: newComment,
          userId: user.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewComment('');
        fetchComments();
        toast.success('Comment posted successfully!');
      } else {
        toast.error(data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      toast.error('An error occurred while posting the comment');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchComments();
        toast.success('Comment deleted successfully');
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('An error occurred while deleting the comment');
    }
  };

  const handleEditComment = async (commentId: string) => {
    setEditingComment(commentId);
    const comment = comments.find(c => c._id === commentId);
    if (comment) {
      setEditContent(comment.content);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
          userId: user?.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setComments(comments.map(comment => 
          comment._id === commentId ? { ...comment, content: editContent, updatedAt: new Date().toISOString() } : comment
        ));
        setEditingComment(null);
        toast.success('Comment updated successfully');
      } else {
        toast.error(data.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('An error occurred while updating the comment');
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await response.json();
      if (data.success) {
        fetchCommentLikes(commentId);
      }
    } catch (error) {
      console.error('Failed to like/unlike comment:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6">Comments</Typography>
      <List>
        {comments.map((comment) => (
          <ListItem key={comment._id} alignItems="flex-start">
            <Link href={`/profile/${comment.user._id}`} passHref>
              <Avatar 
                src={comment.user.profilePicture} 
                sx={{ mr: 2, cursor: 'pointer' }}
              >
                {!comment.user.profilePicture && comment.user.name[0]}
              </Avatar>
            </Link>
            <ListItemText
              primary={
                <React.Fragment>
                  <Typography component="span" variant="subtitle2">
                    {comment.user.name} (@{comment.user.username})
                  </Typography>
                  {user && user.id === comment.user._id && (
                    <>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditComment(comment._id)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                  )}
                </React.Fragment>
              }
              secondary={
                <React.Fragment>
                  {editingComment === comment._id ? (
                    // Editing interface
                    <Box>
                      <TextField
                        fullWidth
                        multiline
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        margin="normal"
                      />
                      <Button onClick={() => handleSaveEdit(comment._id)}>Save</Button>
                      <Button onClick={() => setEditingComment(null)}>Cancel</Button>
                    </Box>
                  ) : (
                    // Normal comment display
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {comment.content}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        Created: {new Date(comment.createdAt).toLocaleString()}
                        {comment.updatedAt !== comment.createdAt && 
                          ` (Edited: ${new Date(comment.updatedAt).toLocaleString()})`}
                      </Typography>
                       {/* Like button and count */}
                       <IconButton onClick={() => handleCommentLike(comment._id)} size="small">
                        {commentLikes[comment._id]?.userLiked ? <FavoriteIcon color="primary" /> : <FavoriteBorderIcon />}
                      </IconButton>
                      <Typography variant="caption" component="span">
                        {commentLikes[comment._id]?.count || 0} likes
                      </Typography>
                    </>
                  )}
                </React.Fragment>
              }
            />
          </ListItem>
        ))}
      </List>
      {user ? (
        <Box component="form" onSubmit={handleSubmitComment}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            margin="normal"
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={isPosting}
            startIcon={isPosting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isPosting ? 'Posting...' : 'Post Comment'}
          </Button>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Please log in to post a comment.
        </Typography>
      )}
    </Box>
  );
};

export default CommentSection;