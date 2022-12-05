import { PostDBModel } from '../modules/posts/infrastructure/entity/postDB.model';

export const toPostOutputBeforeCreate = (postsBD: PostDBModel) => {
  return {
    id: postsBD.id,
    title: postsBD.title,
    shortDescription: postsBD.shortDescription,
    content: postsBD.content,
    blogId: postsBD.blogId,
    blogName: postsBD.blogName,
    createdAt: postsBD.createdAt,
    extendedLikesInfo: {
      myStatus: 'None',
      likesCount: 0,
      dislikesCount: 0,
      newestLikes: [],
    },
  };
};
