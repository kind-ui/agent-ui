// The app's own chat route: a block installs its route at /api/<block>, never here.
export async function POST() {
  return new Response("The app's chat route");
}
