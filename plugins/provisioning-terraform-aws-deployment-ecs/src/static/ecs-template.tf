module "${{ ECS_CLUSTER_MODULE_NAME }}" {
  source  = "terraform-aws-modules/ecs/aws//modules/cluster"
  version = "5.2.2"

  cluster_name = "${{ CLUSTER_NAME }}"

  ${{ CLUSTER_CAPACITY_PROVIDER }}
}

module "${{ ECS_SERVICE_MODULE_NAME }}" {
  source  = "terraform-aws-modules/ecs/aws//modules/service"
  version = "5.2.2"

  name        = "${{ SERVICE_NAME }}"
  cluster_arn = module.${{ ECS_CLUSTER_MODULE_NAME }}.arn

  cpu    = 1024
  memory = 4096

  container_definitions = {
    ${{ SERVICE_NAME_UNDERSCORE }} = {
      essential = true
      cpu       = 512
      memory    = 1024
      image     = "${{ SERVICE_CONTAINER_IMAGE }}"

      port_mappings = [
        {
          name          = "${{ SERVICE_NAME }}"
          containerPort = ${{ SERVICE_CONTAINER_PORT }}
          hostPort      = ${{ SERVICE_CONTAINER_PORT }}
          protocol      = "tcp"
        }
      ]

      readonly_root_filesystem = false

      enable_cloudwatch_logging = false

      log_configuration = {
        logDriver = "awslogs"
        options = {
          awslogs-create-group = "true"
          awslogs-group = "/ecs/${{ SERVICE_NAME }}"
          awslogs-region = local.region
          awslogs-stream-prefix = "ecs"
        }
      }

      memory_reservation = 100
    }
  }

  load_balancer = {
    service = {
      target_group_arn = element(module.${{ ECS_ALB_MODULE_NAME }}.target_group_arns, 0)
      container_name   = "${{ SERVICE_NAME }}"
      container_port   = ${{ SERVICE_CONTAINER_PORT }}
    }
  }

  subnet_ids = module.vpc.private_subnets

  security_group_rules = {
    alb_ingress_3000 = {
      type                     = "ingress"
      from_port                = ${{ SERVICE_CONTAINER_PORT }}
      to_port                  = ${{ SERVICE_CONTAINER_PORT }}
      protocol                 = "tcp"
      source_security_group_id = module.${{ ECS_SG_MODULE_NAME }}.security_group_id
    }
    egress_all = {
      type        = "egress"
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}

resource "aws_service_discovery_http_namespace" "${{ CLUSTER_NAME_UNDERSCORE }}" {
  name = "${{ CLUSTER_NAME }}"
}

module "${{ ECS_SG_MODULE_NAME }}" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.1.0"

  name        = "${{ SERVICE_NAME }}"
  vpc_id      = module.vpc.vpc_id

  ingress_rules       = ["http-80-tcp"]
  ingress_cidr_blocks = ["0.0.0.0/0"]

  egress_rules       = ["all-all"]
  egress_cidr_blocks = module.vpc.private_subnets_cidr_blocks
}

module "${{ ECS_ALB_MODULE_NAME }}" {
  source  = "terraform-aws-modules/alb/aws"
  version = "8.7.0"

  name = "${{ SERVICE_NAME }}"

  load_balancer_type = "application"

  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnets
  security_groups = [module.${{ ECS_SG_MODULE_NAME }}.security_group_id]

  http_tcp_listeners = [
    {
      port               = 80
      protocol           = "HTTP"
      target_group_index = 0
    },
  ]

  target_groups = [
    {
      name             = "${{ SERVICE_NAME }}"
      backend_protocol = "HTTP"
      backend_port     = ${{ SERVICE_CONTAINER_PORT }}
      target_type      = "ip"

      health_check = {
        enabled             = true
        interval            = 30
        path                = "/api/_health/live"
        port                = "traffic-port"
        healthy_threshold   = 3
        unhealthy_threshold = 3
        timeout             = 6
        protocol            = "HTTP"
        matcher             = "200-299"
      }
    },
  ]
}

output "cluster_arn" {
  description = "ARN that identifies the cluster"
  value       = module.${{ ECS_CLUSTER_MODULE_NAME }}.arn
}

output "cluster_id" {
  description = "ID that identifies the cluster"
  value       = module.${{ ECS_CLUSTER_MODULE_NAME }}.id
}

output "cluster_name" {
  description = "Name that identifies the cluster"
  value       = module.${{ ECS_CLUSTER_MODULE_NAME }}.name
}

output "cluster_capacity_providers" {
  description = "Map of cluster capacity providers attributes"
  value       = module.${{ ECS_CLUSTER_MODULE_NAME }}.cluster_capacity_providers
}

output "service_id" {
  description = "ARN that identifies the service"
  value       = module.${{ ECS_SERVICE_MODULE_NAME }}.id
}

output "service_name" {
  description = "Name of the service"
  value       = module.${{ ECS_SERVICE_MODULE_NAME }}.name
}

output "service_iam_role_name" {
  description = "Service IAM role name"
  value       = module.${{ ECS_SERVICE_MODULE_NAME }}.iam_role_name
}

output "service_iam_role_arn" {
  description = "Service IAM role ARN"
  value       = module.${{ ECS_SERVICE_MODULE_NAME }}.iam_role_arn
}

output "service_iam_role_unique_id" {
  description = "Stable and unique string identifying the service IAM role"
  value       = module.${{ ECS_SERVICE_MODULE_NAME }}.iam_role_unique_id
}

output "service_container_definitions" {
  description = "Container definitions"
  value       = module.${{ ECS_SERVICE_MODULE_NAME }}.container_definitions
}

output "service_task_definition_arn" {
  description = "Full ARN of the Task Definition (including both `family` and `revision`)"
  value       = module.${{ ECS_SERVICE_MODULE_NAME }}.task_definition_arn
}
