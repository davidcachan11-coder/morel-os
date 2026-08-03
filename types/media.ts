/**
 * Shared media-asset shape — deliberately its own module (not defined in
 * content/types.ts) so both content/types.ts (editorial content) and
 * data/catalog.ts (Product.image) can depend on it without a circular
 * import: content/types.ts already depends on data/catalog.ts for
 * CategoryId, so MediaAsset can't live on either side of that edge
 * without creating a cycle.
 *
 * Plain and JSON-serializable on purpose — this is exactly the shape a
 * future CMS/media library would transmit as JSON, so no rewrite is
 * needed when the source moves from a static file to a database.
 */
export interface MediaAsset {
  src: string;
  alt: string;
  credit?: string;
}
