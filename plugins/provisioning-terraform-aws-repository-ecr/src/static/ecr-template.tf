module "${{ MODULE_NAME }}" {
  source  = "terraform-aws-modules/ecr/aws"
  version = "1.6.0"

  repository_name = "${{ NAME }}"
  repository_type = "${{ TYPE }}"

  repository_force_delete = ${{ CONFIGURATION_FORCE_DELETE }}

  repository_read_access_arns       = []
  repository_read_write_access_arns = []
}

output "repository_arn" {
  description = "Full ARN of the repository"
  value       = module.${{ MODULE_NAME }}.repository_arn
}

output "repository_registry_id" {
  description = "The registry ID where the repository was created"
  value       = module.${{ MODULE_NAME }}.repository_registry_id
}

output "repository_url" {
  description = "The URL of the repository (in the form `aws_account_id.dkr.ecr.region.amazonaws.com/repositoryName`)"
  value       = module.${{ MODULE_NAME }}.repository_url
}
