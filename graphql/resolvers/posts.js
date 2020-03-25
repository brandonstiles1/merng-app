const Post = require( '../../models/Post' );
const checkAuth = require( '../../util/checkAuth' );
const { AuthenticationError } = require( 'apollo-server' );

module.exports = {
  Query: {
    async getPosts () {
      try {
        const posts = await Post.find().sort( { createdAt: 1 } );
        return posts;
      } catch ( err ) {
        throw new Error( err )
      }
    },
    async getPost ( _, { postId } ) {
      try {
        const post = await Post.findById( postId );
        if ( post ) {
          return post;
        } else {
          throw new Error( 'Post not found' );
        }
      } catch ( err ) {
        throw new Error( 'Post not found' );
      }
    }
  },
  Mutation: {
    async createPost ( _, { body }, context ) {
      const user = checkAuth( context );
      console.log( user );

      if (arguments.body.trim() === ''){
        throw new Error('Post body must not be empty');
      }

      const newPost = new Post( {
        body,
        user: user.indexOf,
        username: user.username,
        createdAt: new Date().toISOString()
      } );

      const post = await newPost.save();

      context.pubsub.publish('NEW_POST', {
        newPost: post
      });

      return post;
    },

    async deletePost ( _, { postId }, context ) {
      const user = checkAuth( context );

      try {
        const post = await Post.findById( postId );
        if ( user.username === post.username ) {
          await post.delete();
          return 'Post successfully deleted'
        } else {
          throw new AuthenticationError( 'Action not allowed' )
        }
      } catch ( err ) {
        throw new Error( err );
      }
    }
  },
  Subscription: {
    newPost: {
      subscribe: ( _, __, { pubsub } ) => pubsub.asyncIterator( 'NEW_POST' )
    }
  }
};