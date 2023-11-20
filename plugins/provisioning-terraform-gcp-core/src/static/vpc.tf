// https://registry.terraform.io/modules/terraform-google-modules/network/google/latest
module "network" {
  source  = "terraform-google-modules/network/google"
  version = "8.0.0"

  for_each = local.environments

  project_id   = module.host_project_environments[each.key].project_id
  network_name = "vpc-${each.key}-shared"
  routing_mode = "GLOBAL"

  subnets = [
    {
      subnet_name           = "subnet-${each.key}-1"
      subnet_ip             = cidrsubnet(each.value.cidr, 8, 0)
      subnet_region         = "europe-west1"
      subnet_private_access = true
    },
    {
      subnet_name           = "subnet-${each.key}-2"
      subnet_ip             = cidrsubnet(each.value.cidr, 8, 4)
      subnet_region         = "europe-west2"
      subnet_private_access = true
    },
    {
      subnet_name           = "subnet-${each.key}-3"
      subnet_ip             = cidrsubnet(each.value.cidr, 8, 8)
      subnet_region         = "europe-west3"
      subnet_private_access = true
    },
  ]
}
