// https://registry.terraform.io/modules/terraform-google-modules/group/google/0.6.0
module "groups" {
  source  = "terraform-google-modules/group/google"
  version = "~> 0.5"

  for_each = local.teams

  id           = format("%s@%s", each.value, var.domain)
  display_name = format("%s@%s", each.value, var.domain)
  customer_id  = data.google_organization.organization.directory_customer_id

  types = [
    "default",
    "security",
  ]
}
