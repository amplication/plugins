module "${{ RDS_MODULE_NAME }}" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.2.0"

  identifier = "${{ DATABASE_IDENTIFIER }}"

  engine               = "postgres"
  engine_version       = "14"
  family               = "postgres14"
  major_engine_version = "14"
  instance_class       = "${{ INSTANCE_CLASS }}"

  allocated_storage     = ${{ ALLOCATED_STORAGE }}
  max_allocated_storage = ${{ MAXIMUM_STORAGE }}

  db_name  = "${{ DATABASE_NAME }}"
  username = "${{ DATABASE_USERNAME }}"
  password = random_password.password.result
  port     = ${{ DATABASE_PORT }}

  manage_master_user_password = false

  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [module.${{ SG_MODULE_NAME }}.security_group_id]

  maintenance_window      = "${{ MAINTENANCE_WINDOWS }}"
  backup_window           = "${{ BACKUP_WINDOW }}"
  backup_retention_period = ${{ BACKUP_RETENTION_PERIOD }}
}

resource "random_password" "password" {
  length           = 20
  special          = false
}

module "${{ SG_MODULE_NAME }}" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.0.0"

  name        = "${{ SECURITY_GROUP_IDENTIFIER }}"
  vpc_id      = module.vpc.vpc_id

  ingress_with_cidr_blocks = [
    {
      from_port   = ${{ DATABASE_PORT }}
      to_port     = ${{ DATABASE_PORT }}
      protocol    = "tcp"
      cidr_blocks = module.vpc.vpc_cidr_block
    },
  ]
}

output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = module.${{ RDS_MODULE_NAME }}.db_instance_address
}

output "db_instance_arn" {
  description = "The ARN of the RDS instance"
  value       = module.${{ RDS_MODULE_NAME }}.db_instance_arn
}

output "db_instance_availability_zone" {
  description = "The availability zone of the RDS instance"
  value       = module.${{ RDS_MODULE_NAME }}.db_instance_availability_zone
}

output "db_instance_endpoint" {
  description = "The connection endpoint"
  value       = module.${{ RDS_MODULE_NAME }}.db_instance_endpoint
}

output "db_instance_engine" {
  description = "The database engine"
  value       = module.${{ RDS_MODULE_NAME }}.db_instance_engine
}

output "db_instance_identifier" {
  description = "The RDS instance identifier"
  value       = module.${{ RDS_MODULE_NAME }}.db_instance_identifier
}

output "db_instance_name" {
  description = "The database name"
  value       = module.${{ RDS_MODULE_NAME }}.db_instance_name
}

output "db_instance_username" {
  description = "The master username for the database"
  value       = module.${{ RDS_MODULE_NAME }}.db_instance_username
  sensitive   = true
}

output "db_instance_port" {
  description = "The database port"
  value       = module.${{ RDS_MODULE_NAME }}.db_instance_port
}

output "db_subnet_group_id" {
  description = "The db subnet group name"
  value       = module.${{ RDS_MODULE_NAME }}.db_subnet_group_id
}

output "db_subnet_group_arn" {
  description = "The ARN of the db subnet group"
  value       = module.${{ RDS_MODULE_NAME }}.db_subnet_group_arn
}

output "db_parameter_group_id" {
  description = "The db parameter group id"
  value       = module.${{ RDS_MODULE_NAME }}.db_parameter_group_id
}

output "db_parameter_group_arn" {
  description = "The ARN of the db parameter group"
  value       = module.${{ RDS_MODULE_NAME }}.db_parameter_group_arn
}
