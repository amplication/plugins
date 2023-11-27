// https://registry.terraform.io/modules/terraform-google-modules/project-factory/google/14.4.0
module "host_project_environments" {
  source  = "terraform-google-modules/project-factory/google"
  version = "14.4.0"

  for_each = local.environments

  random_project_id = true

  name       = format("%s-hst", each.key)
  project_id = format("%s-hst", each.key)
  org_id     = var.organization_id
  folder_id  = module.folders_top_level.ids["common"]

  enable_shared_vpc_host_project = true

  billing_account = var.billing_account

  activate_apis = [
    "storage.googleapis.com",
    "compute.googleapis.com"
  ]

  depends_on = [
    module.folders_top_level,
  ]
}
