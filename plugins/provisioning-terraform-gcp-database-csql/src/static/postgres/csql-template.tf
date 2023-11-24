
module "${{ MODULE_NAME }}" {
  source  = "googlecloudplatform/sql-db/google//modules/postgresql"
  version = "17.1.0"

  name                 = "${{ NAME }}"
  database_version     = "${{ POSTGRES_DATABASE_VERSION }}"
  project_id           = "${{ PROJECT_IDENTIFIER }}"
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

  database_flags = []

  ip_configuration = {
    ipv4_enabled                  = false
    psc_enabled                   = true
    psc_allowed_consumer_projects = [
        // TODO - implement output from the network module & share service projects
    ]
  }

  additional_databases = []
  additional_users     = []

  iam_users = []
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
  value = module.${{ MODULE_NAME }}.replicas
}

output "instances" {
  value = module.${{ MODULE_NAME }}.instances
}