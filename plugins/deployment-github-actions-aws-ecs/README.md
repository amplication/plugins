# @amplication/plugin-deployment-github-actions-aws-ecs

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-deployment-github-actions-aws-ecs)](https://www.npmjs.com/package/@amplication/plugin-deployment-github-actions-aws-ecs)

Adds a Github Actions workflow file & Amazon Elastic Container Service task definition for the generated service.

## Purpose

Adds a Github Actions workflow file for building and pushing a container image to Amazon Elastic Container Registry. In addition it creates a task definition for deploying the previously built image onto an Amazon Elastic Container Service cluster. It requires infrastructure to deploy on to be present - how to create this infrastructure can be found in the configuration part.

## Configuration

Compared to other plugins, this plugin requires some additional upfront work to get the generated code working as expected. These pre-requisites can be found below after which the settings for the plugin are explained. As the plugins settings are very dependent on the configuration done in the pre-requisites it is adviced to read both.

### Configuration - Pre-requisites

As mentioned there are some pre-requisites to be able to starting using this plugin. The end goal of the plugin is that it deploys a newer version of the generated service onto Amazon Elastic Container Service. This however requires some of the Amazon Web Services services to be configured ahead of time. In this paragraph we'll go through the different services and how to configure them.

`Network: Amazon Virtual Private Cloud (VPC)`: When creating a Amazon Web Services account, it comes with a [`default vpc`](https://docs.aws.amazon.com/vpc/latest/userguide/default-vpc.html) the other services below can be deployed onto this. Although it is advised to create a seperate VPC from the default one and use that.

`Access & permissions: Amazon Identity Access Management (IAM)`: In the process of getting a new version of the service to start running on the Amazon Elastic Container Service we need various permissions. Permissions for the whole process can be divided into two catogories, the first is the process of getting the container image pushed to the Amazon Elastic Container Registry aswell as deploying the task definition onto the Amazon Elastic Container Service. Create a role with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:CompleteLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:InitiateLayerUpload",
        "ecr:BatchCheckLayerAvailability",
        "ecr:PutImage"
      ],
      "Resource": "arn:aws:ecr:region:111122223333:repository/repository-name"
    },
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    }
  ]
}
```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RegisterTaskDefinition",
      "Effect": "Allow",
      "Action": ["ecs:RegisterTaskDefinition"],
      "Resource": "*"
    },
    {
      "Sid": "PassRolesInTaskDefinition",
      "Effect": "Allow",
      "Action": ["iam:PassRole"],
      "Resource": [
        "arn:aws:iam::<aws_account_id>:role/<task_definition_task_role_name>",
        "arn:aws:iam::<aws_account_id>:role/<task_definition_task_execution_role_name>"
      ]
    },
    {
      "Sid": "DeployService",
      "Effect": "Allow",
      "Action": ["ecs:UpdateService", "ecs:DescribeServices"],
      "Resource": [
        "arn:aws:ecs:<region>:<aws_account_id>:service/<cluster_name>/<service_name>"
      ]
    }
  ]
}
```

The second scope of permissions is related to the execution of the task. When running the generated service in the container on Amazon Elastic Container Service, permissions are assigned to the running task/service in the form of a role. The first policy to attach is the default Amazon managed `AmazonECSTaskExecutionRolePolicy`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FetchSecret",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "kms:Decrypt",
      ],
      "Resource": [
        "arn:aws:secretsmanager:<region>:<aws_account_id>:secret:<secret-name-and-suffix>"
        "arn:aws:kms:<region>:<aws_account_id>:key/key_id"
      ]
    },
    {
      "Sid": "CreateLogGroup",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
```

`Database: Amazon Relation Database Service (RDS)`: The generated service needs to connect to a database. One of the suggested choices for this is using the Amazon Relation Database Service, here the applicable database type can be created. Make sure that the database in question is accessible from the private subnet the Amazon Elastic Container Service cluster will be deployed onto, preferrably deployed in a seperate database subnet. The database configuration needs to be passed in the next step under the `DB_URL` in the format shown.

> **Note**
> Before connecting the generated service to the database make sure that the database is instrumented by applying any pending `prisma migrations` to the database in question.

`Secret: AWS Secret Manager`: As our generated service needs some secrets propagated in the form of environment variables, we store the values in a form of a json structure under secrets manager:

```json
{
  "BCRYPT_SALT": "10",
  "JWT_EXPIRATION": "2d",
  "JWT_SECRET_KEY": "abcdef123456",
  "DB_URL": "postgres://user:password@database-instance-identifier.abcdef123456.eu-west-1.rds.amazonaws.com:5432/dabase-name"
}
```

After creating the secret for the `arn` it will be suffixed with a random hash, grab this secret name with the additional suffix and pass it in the settings as `sm_secret_name`, e.g. `secret-name-JzvSgm`. Pointers to the different variables in this secret will subsequently automatically be made in the task definition. Add onto this where desired.

`Cluster & Service: Amazon Elastic Container Service (ECS)`: The last step is to create the resources within the service, where the GitHub Actions will actually deploy onto. In this service we need to create two resources, a `cluster` and within that cluster a `service`. Make sure that both the `ecs_cluster_name` and `ecs_service_name` are passed through the plugin settings. For the service to be able to be created you have to temporarily assign another task definition family.

### Configuration - Settings

The `region_identifier` settings requires the region identifier of the Amazon Web Services region where the created infrastructure exists in.

The `account_identifier` setting requires the account identifier of the Amazon Web Services account to deploy the task definition and container image to.

The `ecr_repository_name` setting requires the name of the repository for the container image created in the pre-requisites.

The `ecr_image_tag` setting is set to `latest` by default. Another suggestion is to pass in `${{ github.sha }}` where each image will be tagged as the last git commit, allowing for returning to a previous version.

The `ecs_cluster_name` setting requires the name of the cluster that was created in the pre-requisites.

The `ecs_role_name` setting requires the name of the role that will be used when executing the task definition on the cluster. This means that there are some permissions that are needed based on the use-case. As was shown in the previous paragraph there are some permission that are required by default when running the generated service.

The `sm_secret_name` setting requires the name + automatically added suffix - e.g. `secret-name-JzvSgm"` - of the secret created in AWS Secret manager. As was shown in the previous paragraph, the secret should contain the four secrets that are required for the generated service to start: `BCRYPT_SALT`, `JWT_EXPIRATION`, `JWT_SECRET_KEY`, `DB_URL`.

The `resources` sub-category allows the user to specify the `cpu` and `memory` to be allocated to the task/service in question. As there are some constraints between the two it would be adviced to look at the different task sizes in the [documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size).

The `runime` sub-category, allows the user to specify the `os_family` with their applicable `cpu_architecture`. Examples for the `os_family` are `WINDOWS` & `LINUX`, as our generated service are almost always ran on the latter, this has been selected as the default. Examples for `cpu_architecture` within the `os_family` > `LINUX` are `X86_64` but also `ARM64` could be used if desired.

```json
{
  "settings": {
    "region_identifier": "eu-west-1",
    "account_identifier": "012345678901",
    "ecr_repository_name": "repository-name",
    "ecr_image_tag": "latest",
    "ecs_cluster_name": "development-cluster",
    "ecs_role_name": "task-execution-role-name",
    "sm_secret_name": "secret-name-JzvSgm",
    "resources": {
      "cpu": "1024",
      "memory": "2048"
    },
    "runtime": {
      "cpu_architecture": "X86_64",
      "os_family": "LINUX"
    }
  }
}
```

## Usage

As this is an addition to the code base, where non of the other code is touched, using the plugin won't impact the final build.
