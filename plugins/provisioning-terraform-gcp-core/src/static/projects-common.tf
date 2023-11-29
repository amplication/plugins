// https://registry.terraform.io/modules/terraform-google-modules/project-factory/google/14.4.0
module "host_project_logging" {
  source  = "terraform-google-modules/project-factory/google"
  version = "14.4.0"

  random_project_id = true

  name       = "logging"
  project_id = "logging"
  org_id     = var.organization_id
  folder_id  = module.folders_top_level.ids["common"]

  billing_account = var.billing_account

  activate_apis = [
    "storage.googleapis.com",
    "logging.googleapis.com"
  ]

  depends_on = [
    module.folders_top_level,
  ]
}

// https://registry.terraform.io/modules/terraform-google-modules/project-factory/google/14.4.0
module "host_project_monitoring" {
  source  = "terraform-google-modules/project-factory/google"
  version = "14.4.0"

  random_project_id = true

  name       = "monitoring"
  project_id = "monitoring"
  org_id     = var.organization_id
  folder_id  = module.folders_top_level.ids["common"]

  billing_account = var.billing_account

  activate_apis = [
    "storage.googleapis.com",
    "monitoring.googleapis.com"
  ]

  depends_on = [
    module.folders_top_level,
  ]
}

// https://registry.terraform.io/modules/terraform-google-modules/project-factory/google/14.4.0
module "host_project_artifacts" {
  source  = "terraform-google-modules/project-factory/google"
  version = "14.4.0"

  random_project_id = true

  name       = "artifacts"
  project_id = "artifacts"
  org_id     = var.organization_id
  folder_id  = module.folders_top_level.ids["common"]

  billing_account = var.billing_account

  activate_apis = [
    "artifactregistry.googleapis.com",
  ]

  depends_on = [
    module.folders_top_level,
  ]
}
