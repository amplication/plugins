provider "aws" {
  region = local.region

  default_tags {
    tags = {
      Terraform   = "true"
      Amplication = "true"
      Environment = local.environment
    }
  }
}

data "aws_availability_zones" "available" {}

locals {
  name        = "${{ NAME }}"
  region      = "${{ REGION_IDENTIFIER }}"
  environment = "${{ ENVIRONMENT }}"
  
  vpc_cidr_block  = "${{ CIDR_BLOCK }}"
  vpc_azs         = slice(data.aws_availability_zones.available.names, 0, 3)
}
