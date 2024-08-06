module "${{ MODULE_NAME }}" {
  source  = "googlecloudplatform/sql-db/google//modules/postgresql"
  version = "17.1.0"

  name                 = "${{ ENVIRONMENT }}-${{ NAME }}"
  database_version     = "${{ VERSION }}"
  project_id           = "${module.service_project_teams["${{ ENVIRONMENT }}-${{ TEAM }}"].project_id}"
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
  }
}

output "name" {
  value = module.${{ MODULE_NAME }}.instance_name
}

output "user_name" {
  value = module.${{ MODULE_NAME }}.user_name
}

output "generated_user_password" {
  sensitive = true
  value     = module.${{ MODULE_NAME }}.generated_user_password
}

output "replicas" {
  sensitive = true
  value     = module.${{ MODULE_NAME }}.replicas
}

output "instances" {
  sensitive = true
  value     = module.${{ MODULE_NAME }}.instances
}