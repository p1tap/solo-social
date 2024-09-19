"use client";
//app\profile\[userId]\page.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/app/components/Header';
import CommentSection from '@/app/components/CommentSection';
import EditProfileForm from '@/app/components/EditProfileForm';
import { Box, Typography, Container, Avatar, Paper, Card, CardContent, IconButton, CircularProgress, Button } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Post as PostType } from '@/app/types';
import { useAuth } from '@/app/contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import PostCard from '@/app/components/PostCard';


interface ProfileUser {
  _id: string;
  username: string;
  name: string;
  bio: string;
  __v: number;
  profilePicture?: string;
}


export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const params = useParams();
  const userId = params?.userId as string;
  const { user: currentUser } = useAuth();

  const fetchProfileData = useCallback(async () => {
    if (!userId) {
      console.error('userId is undefined');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/profile/${userId}`);
      const data = await response.json();
      if (data.success) {
        setUser(data.data.user);
        setPosts(data.data.posts);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
  if (params.userId) {
    fetchProfileData();
  } else {
    console.error('userId is undefined');
    setLoading(false);
  }
}, [fetchProfileData, params.userId]);


  const handleUpdateSuccess = () => {
    setIsEditing(false);
    fetchProfileData();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Typography>User not found</Typography>;
  }

  const isOwnProfile = currentUser && currentUser.id === user._id;
  return (
    <Box>
      <Header />
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ mt: 4, mb: 4, p: 3, textAlign: 'center' }}>
          {isEditing ? (
            <EditProfileForm user={user as ProfileUser} onUpdateSuccess={handleUpdateSuccess} />
          ) : (
            <>
              <Box
                sx={{
                  position: 'relative',
                  width: 100,
                  height: 100,
                  margin: '0 auto',
                  mb: 2,
                  cursor: isOwnProfile ? 'pointer' : 'default',
                }}
                onClick={() => isOwnProfile && setIsEditing(true)}
              >
                <Avatar 
                  src={user.profilePicture || undefined} 
                  sx={{ width: '100%', height: '100%' }}
                >
                  {!user.profilePicture && user.name[0]}
                </Avatar>
                {isOwnProfile && (
                  <>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s',
                        borderRadius: '50%', 
                        '&:hover': {
                          opacity: 1,
                        },
                      }}
                    >
                      <EditIcon sx={{ color: 'white' }} />
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'primary.main',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <EditIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                  </>
                )}
              </Box>
              <Typography variant="h4">{user.name}</Typography>
              <Typography variant="subtitle1" color="text.secondary">@{user.username}</Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>{user.bio || "No bio available"}</Typography>
              {isOwnProfile && (
                <Button onClick={() => setIsEditing(true)} variant="outlined" sx={{ mt: 2 }}>
                  Edit Profile
                </Button>
              )}
            </>
          )}
        </Paper>
        <Typography variant="h5" sx={{ mb: 2 }}>Posts</Typography>
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post._id} post={post} onPostUpdated={fetchProfileData} />
          ))
        ) : (
          <Typography variant="body1">No posts yet.</Typography>
        )}
      </Container>
    </Box>
  );
}