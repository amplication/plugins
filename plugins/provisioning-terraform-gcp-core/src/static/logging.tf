module "logging_destination" {
  source  = "terraform-google-modules/log-export/google//modules/logbucket"
  version = "7.7.0"

  project_id               = module.host_project_logging.project_id
  name                     = "organization-logging-destination"
  location                 = "global"
  retention_days           = 30
  log_sink_writer_identity = module.logging_export.writer_identity
}

module "logging_export" {
  source  = "terraform-google-modules/log-export/google"
  version = "7.7.0"

  destination_uri      = module.logging_destination.destination_uri
  log_sink_name        = "organization-logging-export"
  parent_resource_id   = var.organization_id
  parent_resource_type = "organization"
  include_children     = true
}
