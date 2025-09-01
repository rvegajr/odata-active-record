import { ActiveRecord, EntityNamespaceManager } from 'odata-active-record-core';

// Example: Blog application with OData Active Record

async function main() {
  console.log('🚀 OData Active Record - Basic Usage Example\n');

  // Create a namespace for our blog
  const blogNamespace = EntityNamespaceManager.createNamespace('blog');

  // Define our entities
  const Post = blogNamespace.registerEntity('Post', {
    title: { type: 'string', nullable: false },
    content: { type: 'string', nullable: false },
    publishedAt: { type: 'date', nullable: true },
    isPublished: { type: 'boolean', nullable: false, defaultValue: false },
    viewCount: { type: 'number', nullable: false, defaultValue: 0 },
    tags: { type: 'array', nullable: true }
  });

  const Author = blogNamespace.registerEntity('Author', {
    name: { type: 'string', nullable: false },
    email: { type: 'string', nullable: false },
    bio: { type: 'string', nullable: true },
    joinDate: { type: 'date', nullable: false }
  });

  console.log('✅ Entities registered successfully');

  // Create some authors
  console.log('\n📝 Creating authors...');
  
  const author1 = await Author.create({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Tech enthusiast and blogger',
    joinDate: '2024-01-01' // Any date format works!
  });

  const author2 = await Author.create({
    name: 'Jane Smith',
    email: 'jane@example.com',
    bio: 'Full-stack developer',
    joinDate: 'yesterday' // Relative dates work too!
  });

  console.log('✅ Authors created:', author1.data?.name, 'and', author2.data?.name);

  // Create some posts
  console.log('\n📝 Creating posts...');
  
  const post1 = await Post.create({
    title: 'Getting Started with OData',
    content: 'OData is a powerful protocol for building and consuming RESTful APIs...',
    publishedAt: '2024-01-15T10:30:00Z',
    isPublished: true,
    viewCount: 150,
    tags: ['odata', 'api', 'tutorial']
  });

  const post2 = await Post.create({
    title: 'Advanced Query Techniques',
    content: 'Learn how to build complex queries with OData...',
    publishedAt: '2024-01-20',
    isPublished: true,
    viewCount: 89,
    tags: ['odata', 'queries', 'advanced']
  });

  const post3 = await Post.create({
    title: 'Draft: Future Features',
    content: 'This is a draft post...',
    isPublished: false, // Will use default value
    tags: ['draft', 'features']
  });

  console.log('✅ Posts created successfully');

  // Query examples
  console.log('\n🔍 Query Examples:');

  // 1. Find all published posts
  const publishedPosts = await Post
    .where('isPublished', 'eq', true)
    .orderBy('publishedAt', 'desc')
    .find();

  console.log(`📊 Found ${publishedPosts.data.length} published posts`);

  // 2. Find popular posts (view count > 100)
  const popularPosts = await Post
    .where('viewCount', 'gt', 100)
    .where('isPublished', 'eq', true)
    .select(['title', 'viewCount', 'publishedAt'])
    .orderBy('viewCount', 'desc')
    .find();

  console.log('🔥 Popular posts:');
  popularPosts.data.forEach(post => {
    console.log(`  - ${post.title} (${post.viewCount} views)`);
  });

  // 3. Search posts by title
  const searchResults = await Post
    .where('title', 'contains', 'OData')
    .find();

  console.log(`🔍 Found ${searchResults.data.length} posts containing "OData"`);

  // 4. Get posts with specific tags
  const tutorialPosts = await Post
    .where('tags', 'contains', 'tutorial')
    .find();

  console.log(`📚 Found ${tutorialPosts.data.length} tutorial posts`);

  // 5. Complex query with multiple conditions
  const recentPopularPosts = await Post
    .where('isPublished', 'eq', true)
    .where('viewCount', 'gt', 50)
    .where('publishedAt', 'gt', '2024-01-10')
    .select(['title', 'viewCount', 'publishedAt'])
    .orderBy('viewCount', 'desc')
    .limit(5)
    .find();

  console.log('\n📈 Recent popular posts:');
  recentPopularPosts.data.forEach(post => {
    console.log(`  - ${post.title} (${post.viewCount} views, ${post.publishedAt})`);
  });

  // Update example
  console.log('\n✏️ Updating a post...');
  
  const updateResult = await Post
    .where('title', 'eq', 'Getting Started with OData')
    .update({ 
      viewCount: 200,
      tags: ['odata', 'api', 'tutorial', 'beginner']
    });

  console.log('✅ Post updated successfully');

  // Count examples
  console.log('\n📊 Statistics:');
  
  const totalPosts = await Post.count();
  const publishedCount = await Post.where('isPublished', 'eq', true).count();
  const draftCount = await Post.where('isPublished', 'eq', false).count();

  console.log(`  Total posts: ${totalPosts.data}`);
  console.log(`  Published: ${publishedCount.data}`);
  console.log(`  Drafts: ${draftCount.data}`);

  // Error handling example
  console.log('\n⚠️ Error handling example:');
  
  const errorResult = await Post.create({
    title: '', // Empty title (should fail validation)
    content: 'This should fail',
    publishedAt: 'invalid-date' // Invalid date
  });

  if (!errorResult.success) {
    console.log('❌ Expected errors occurred:');
    errorResult.errors.forEach(error => {
      console.log(`  - ${error.message}`);
    });
  }

  // Date handling examples
  console.log('\n📅 Date handling examples:');
  
  const datePost = await Post.create({
    title: 'Date Handling Demo',
    content: 'This post demonstrates various date formats',
    publishedAt: '01/15/2024', // MM/DD/YYYY
    isPublished: true
  });

  console.log('✅ Post created with MM/DD/YYYY date format');

  // Namespace isolation example
  console.log('\n🔒 Namespace isolation example:');
  
  const analyticsNamespace = EntityNamespaceManager.createNamespace('analytics');
  const PageView = analyticsNamespace.registerEntity('PageView', {
    page: { type: 'string', nullable: false },
    timestamp: { type: 'date', nullable: false },
    userId: { type: 'string', nullable: true }
  });

  // This is completely separate from the blog namespace
  await PageView.create({
    page: '/blog',
    timestamp: 'now',
    userId: 'user123'
  });

  console.log('✅ Analytics namespace is completely isolated from blog namespace');

  // List all namespaces
  console.log('\n📋 All namespaces:');
  const namespaces = EntityNamespaceManager.listNamespaces();
  namespaces.forEach(ns => {
    console.log(`  - ${ns.name} (${ns.entityCount} entities)`);
  });

  console.log('\n🎉 Example completed successfully!');
  console.log('\n💡 Key features demonstrated:');
  console.log('  ✅ ORM-like API with fluent queries');
  console.log('  ✅ Automatic date parsing (any format)');
  console.log('  ✅ Namespace isolation');
  console.log('  ✅ User-friendly error handling');
  console.log('  ✅ Schema validation');
  console.log('  ✅ Complex query building');
  console.log('  ✅ Type safety with TypeScript');
}

// Run the example
main().catch(console.error);
