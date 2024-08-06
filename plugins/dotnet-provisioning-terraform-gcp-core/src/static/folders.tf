// https://registry.terraform.io/modules/terraform-google-modules/folders/google/4.0.1
module "folders_top_level" {
  source  = "terraform-google-modules/folders/google"
  version = "4.0.1"

  parent = "organizations/${var.organization_id}"
  names = [
    "common",
    "environments"
  ]
}

// https://registry.terraform.io/modules/terraform-google-modules/folders/google/4.0.1
module "folders_environments_level" {
  source  = "terraform-google-modules/folders/google"
  version = "4.0.1"

  parent = module.folders_top_level.ids["environments"]
  names  = keys(local.environments)

  depends_on = [
    module.folders_top_level,
  ]
}
