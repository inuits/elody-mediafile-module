# Mediafile Module

A `graphql-modules` module that handles all mediafile concerns in the Elody platform. It provides GraphQL types/queries/resolvers, four REST data sources, and three Express proxy endpoints for upload, download, and IIIF access.

## What's included

| Layer | What it adds |
|-------|-------------|
| GraphQL schema | `MediaFile`, `MediaFileEntity`, `MediaFileInput`, `MediaFileMetadataInput`, queries & mutations (see below) |
| GraphQL resolvers | Resolvers for all mediafile queries, mutations, and type fields |
| DataSources | `CollectionAPI` (extended), `MediafileTranscodeService`, `StorageAPI`, `OcrService` — injected into every resolver context |
| Express endpoints | `/api/upload/*`, `/api/download/zip/:id`, `/api/mediafile/*`, `/api/iiif/*` |

---

## Express endpoints

### Upload — `uploadEndpoint.ts`

| Method | Path | Proxies to | Purpose |
|--------|------|-----------|---------|
| `POST` | `/api/upload/batch` | `collection-api /batch` | Batch entity creation from CSV or Excel. Pass `?dry_run=1` to validate without creating. |
| `POST` | `/api/upload/single` | `collection-api /entities` or `/entities/:id/mediafiles` | Upload a single file as a standalone entity or linked to an existing entity (pass `?hasRelation=true&entityId=<id>`). |

### Download zip — `downloadZipEndpoint.ts`

| Method | Path | Proxies to | Purpose |
|--------|------|-----------|---------|
| `GET` | `/api/download/zip/:id` | `transcode-service /transcode/zip` | Triggers a zip build for the given entity and streams the result back. |

### Mediafile & IIIF — `mediafilesEndpoint.ts`

| Method | Path | Proxies to | Purpose |
|--------|------|-----------|---------|
| `GET` | `/api/mediafile/*` | `storage-api` (transcode or original) | Resolves the signed download URL from collection-api and streams the file. Add `?original=true` for the original; `?originalFilename=<name>` to set the `Content-Disposition` filename. |
| `GET` | `/api/iiif*.json` | IIIF service (manifest) | Proxies IIIF manifests and rewrites the `id` field in the JSON response to keep paths consistent. Also adds a `Link: rel="describedby"` header pointing to the collection-api entity. |
| `GET` | `/api/iiif/*` | IIIF image service | Proxies IIIF image tiles/thumbnails. Falls back to a static token when `IIIF_ALLOW_STATIC_TOKEN_FALLBACK=true` and user-token refresh fails. |

> **Internal URL resolution**: collection-api returns `*.localhost` download URLs (Traefik-facing). The endpoint rewrites these to internal service addresses so server-side fetches succeed inside Docker.

---

## DataSources

All sources extend `AuthRESTDataSource` from `base-graphql` and are available as `context.dataSources.*` in every resolver.

### `CollectionAPI` (from `base-graphql`)
The shared collection-api data source. The mediafile module uses it for all mediafile-related collection-api calls — no separate `MediafileAPI` data source exists.

| Method | REST call | Description |
|--------|-----------|-------------|
| `getMediaFile(id)` | `GET /mediafiles/{id}` | Fetch a single mediafile |
| `getMediafiles(entityId)` | `GET /entities/{id}/mediafiles?non_public=1` | List all mediafiles for an entity |
| `patchMetaDataMediaFile(id, metadata)` | `PATCH /mediafiles/{id}` | Update mediafile metadata |
| `getAssetsRelationedWithMediafFile(id)` | `GET /mediafiles/{id}/assets` | Get assets related to a mediafile |
| `linkMediafileToEntity(entityId, input)` | `POST /entities/{entityId}/mediafiles` | Attach a mediafile to an entity |

### `MediafileTranscodeService`
Extends `TranscodeService` from `base-graphql`.

| Method | REST call | Description |
|--------|-----------|-------------|
| `generateTranscode(mediafiles, type, masterEntityId?)` | `POST /transcode/{type}` | Request a transcode job |

### `StorageAPI`
Extends `AuthRESTDataSource`. Provides a typed handle to the storage service; direct REST calls go through the proxy endpoints above.

### `OcrService`
Talks to the **OCR service**.

| Method | REST call | Description |
|--------|-----------|-------------|
| `generateOcrWithAsset(assetId, operations, language)` | `POST /ocr?language={language}` | Trigger OCR on an asset |

---

## GraphQL API

### Queries

| Query | Description |
|-------|-------------|
| `getMediafile(id)` | Fetch a single `MediaFile` |
| `FetchMediafilesOfEntity(id)` | List all mediafiles belonging to an entity |
| `GetPrimaryMediafileFromEntity(id)` | Get the primary mediafile for an entity |
| `DownloadItemsInZip` | Initiate a zip download for a set of items |
| `GenerateOcrWithAsset` | Trigger OCR and return the result |

### Mutations

| Mutation | Description |
|----------|-------------|
| `patchMediaFileMetadata(id, input)` | Update metadata on a mediafile |
| `getAssetsRelationedWithMediafFile(id)` | Retrieve assets linked to a mediafile |
| `generateTranscode(input)` | Request a transcode job for one or more mediafiles |
| `linkMediafileToEntity(entityId, input)` | Link a mediafile to an entity |

### Types

```graphql
type MediaFile {
  # ... all mediafile fields
  isPublic: Boolean
}

type MediaFileEntity implements Entity {
  id: String
  uuid: String
  type: String
  intialValues: [MetaData]
  allowedViewModes: [ViewMode]
  relationValues: [Relation]
  entityView: EntityView
  teaserMetadata: [MetaData]
}

enum Entitytyping { mediafile, mediaFileEntity, ... }
enum Collection { mediafiles, ... }
```

---

## Using the module

Import `mediafileElodyConfig` and spread it into your `baseGraphql` setup:

```ts
import { mediafileElodyConfig } from 'mediafile-module';

const config = {
  modules: [...mediafileElodyConfig.modules],
  dataSources: { ...mediafileElodyConfig.dataSources },
  endpoints: [...(mediafileElodyConfig.endpoints ?? [])],
};
```

The module merges three additional data sources into the `DataSources` interface (via declaration merging in `mediafileModule.ts`). Mediafile-related collection-api calls go through the existing `CollectionAPI` from `base-graphql`.

---

## Environment variables

| Variable | Effect |
|----------|--------|
| `IIIF_ALLOW_STATIC_TOKEN_FALLBACK` | Set to `true` to fall back to a static bearer token when user-token refresh fails on IIIF requests. |
