module "${{ RDS_MODULE_NAME }}" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.2.0"

  identifier = "${{ DATABASE_IDENTIFIER }}"

  engine               = "postgres"
  engine_version       = "14"
  family               = "postgres14"
  major_engine_version = "14"
  instance_class       = "${{ DATABASE_INSTANCE_CLASS }}"

  allocated_storage     = ${{ ALLOCATED_STORAGE }}
  max_allocated_storage = ${{ MAXIMUM_STORAGE }}

  db_name  = "${{ DATABASE_NAME }}"
  username = "${{ DATABASE_USERNAME }}"
  port     = ${{ DATABASE_PORT }}

  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [module.${{ SG_MODULE_NAME }}.security_group_id]

  maintenance_window      = "${{ MAINTENANCE_WINDOWS }}"
  backup_window           = "${{ BACKUP_WINDOW }}"
  backup_retention_period = ${{ BACKUP_RETENTION_PERIOD }}
}

module "${{ SG_MODULE_NAME }}" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.0.0"

  name        = ${{ SECURITY_GROUP_IDENTIFIER }}
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