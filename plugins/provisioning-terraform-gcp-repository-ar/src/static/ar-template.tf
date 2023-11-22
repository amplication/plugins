resource "google_artifact_registry_repository" "${{ MODULE_NAME }}" {
  location      = "${{ REGION }}"
  repository_id = "${{ NAME }}"
  project       = "${{ PROJECT_IDENTIFIER }}"
  description   = "Container image repository for ${{ NAME }}"
  format        = "DOCKER"

  docker_config {
    immutable_tags = true
  }
}
