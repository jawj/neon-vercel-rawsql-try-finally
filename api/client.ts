import { Client } from '@neondatabase/serverless';

// don't create a `Pool` or `Client` here, outside the request handler

export default async (req: Request, ctx: any) => {
  // create a `Client` inside the request handler
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  try {
    // get and validate the `postId` query parameter
    const postId = parseInt(new URL(req.url).searchParams.get('postId')!, 10);
    if (isNaN(postId)) return new Response('Bad request', { status: 400 });

    // query and validate the post
    const { rows: [post] } = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (!post) return new Response('Not found', { status: 404 });

    // return the post as JSON
    return new Response(JSON.stringify(post), {
      headers: { 'content-type': 'application/json' }
    });

  } finally {
    // end the `Client` inside the same request handler
    // (unlike `await`, `ctx.waitUntil` won't hold up the response)
    ctx.waitUntil(client.end());
  }
}

export const config = {
  runtime: 'edge',
  regions: ['iad1'],  // specify the region nearest your Neon DB
};
