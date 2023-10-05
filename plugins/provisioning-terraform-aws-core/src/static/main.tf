provider "aws" {
  region = local.region

  default_tags {
    tags = {
      Terraform     = "true"
      Amplication   = "true"
      Environment   = local.environment
    }
  }
}

data "aws_availability_zones" "available" {}

locals {
  name       = "${{ SERVICE_NAME }}"
  region     = "${{ REGION }}"
  cidr_block = "${{ CIDR_BLOCK }}"
  azs        = slice(data.aws_availability_zones.available.names, 0, 3)
}
