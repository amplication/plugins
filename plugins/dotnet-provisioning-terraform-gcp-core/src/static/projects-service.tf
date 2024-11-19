// https://registry.terraform.io/modules/terraform-google-modules/project-factory/google/14.4.0/submodules/svpc_service_project
module "service_project_teams" {
  source  = "terraform-google-modules/project-factory/google//modules/svpc_service_project"
  version = "14.4.0"

  for_each = { for group in local.groups : "${group.environment}-${group.team}" => group }

  random_project_id = true

  name            = format("%s-%s-svc", each.value.environment, each.value.team)
  project_id      = format("%s-%s-svc", each.value.environment, each.value.team)
  org_id          = var.organization_id
  billing_account = var.billing_account
  folder_id       = module.folders_environments_level.ids[each.value.environment]

  shared_vpc         = module.host_project_environments[each.value.environment].project_id
  shared_vpc_subnets = module.network[each.value.environment].subnets_self_links

  activate_apis = [
    "storage.googleapis.com",
    "servicenetworking.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com",
    "compute.googleapis.com",
    "run.googleapis.com",
    "container.googleapis.com"
  ]

  domain     = data.google_organization.organization.domain
  group_name = module.groups[each.value.team].name
  group_role = "roles/viewer"

  depends_on = [
    module.folders_environments_level,
    module.host_project_environments,
    module.network,
    module.groups
  ]
}
