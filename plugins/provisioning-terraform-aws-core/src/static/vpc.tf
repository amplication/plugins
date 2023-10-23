// https://github.com/terraform-aws-modules/terraform-aws-vpc/tree/master

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"

  name = join("-", ["vpc", local.name])
  cidr = local.vpc_cidr_block

  azs              = local.vpc_azs
  private_subnets  = [for k, v in local.vpc_azs : cidrsubnet(local.vpc_cidr_block, 8, k)]
  public_subnets   = [for k, v in local.vpc_azs : cidrsubnet(local.vpc_cidr_block, 8, k + 4)]
  database_subnets = [for k, v in local.vpc_azs : cidrsubnet(local.vpc_cidr_block, 8, k + 8)]

  enable_dns_hostnames = ${{ ENABLE_DNS_HOSTNAMES }}
  enable_dns_support   = ${{ ENABLE_DNS_SUPPORT }}

  enable_nat_gateway = ${{ ENABLE_NAT_GATEWAY }}
  single_nat_gateway = ${{ SINGLE_NAT_GATEWAY }}
}
