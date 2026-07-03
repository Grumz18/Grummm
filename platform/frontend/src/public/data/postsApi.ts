import {
  createProjectWithOptions,
  publishPost,
  unpublishPost,
  updateProject,
  type AdminMutationOptions,
  type ProjectUploadBundle
} from "./project-store";
import type { PortfolioProject } from "../types";

export type PostVisibility = "draft" | "private" | "public";

export interface PostListItem extends PortfolioProject {
  visibility: PostVisibility;
  publishedAt?: string;
}

export function createPost(
  post: PortfolioProject,
  upload?: ProjectUploadBundle,
  options: AdminMutationOptions = {}
): Promise<PortfolioProject[]> {
  return createProjectWithOptions({ ...post, kind: "post" }, upload, options);
}

export function updatePost(
  postId: string,
  post: PortfolioProject,
  upload?: ProjectUploadBundle,
  options: AdminMutationOptions = {}
): Promise<PortfolioProject[]> {
  return updateProject(postId, { ...post, kind: "post" }, upload, options);
}

export { publishPost, unpublishPost };
