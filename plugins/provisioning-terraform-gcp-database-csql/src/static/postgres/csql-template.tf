
module "postgresql" {
  source  = "googlecloudplatform/sql-db/google//modules/postgresql"
  version = "17.1.0"

  for_each = local.environments

  name                 = "${each.key}-${{ NAME }}"
  database_version     = "${{ VERSION }}"
  project_id           = "${module.service_project_teams["${each.key}-${{ TEAM }}"].project_id}"
  zone                 = "${{ REGION }}-${{ ZONE_SUFFIX }}"
  region               = "${{ REGION }}"
  tier                 = "${{ TIER }}"

  db_name      = "${{ NAME }}"
  db_charset   = "${{ DATABASE_CHARSET }}"
  db_collation = "${{ DATABASE_COLLATION }}"

  disk_size = "${{ DISK_SIZE }}"
  disk_type = "${{ DISK_TYPE }}"

  availability_type = "${{ AVAILABILITY_TYPE }}"

  deletion_protection = "${{ DELETION_PROTECTION }}"

  database_flags       = []
  additional_databases = []
  additional_users     = []
  iam_users            = []

  ip_configuration = {
    ipv4_enabled    = false
    private_network = "projects/${module.network[each.key].project_id}/global/networks/${module.network[each.key].network_name}"
  }
}

output "name" {
  value = module.postgresql[*].instance_name
}

output "user_name" {
  value = module.postgresql[*].user_name
}

output "generated_user_password" {
  sensitive = true
  value     = module.postgresql[*].generated_user_password
}

output "replicas" {
  value = module.postgresql[*].replicas
}

output "instances" {
  value = module.postgresql[*].instances
}