locals {
  environments = ${{ ENVIRONMENTS }}

  groups = flatten([
    for environment, configuration in local.environments : [
      for team in configuration.teams : {
        environment = "${environment}"
        team        = "${team}"
      }
    ]
  ])

  teams = toset(flatten([
    for environment, configuration in local.environments : [
      for team in configuration.teams : team
    ]
  ]))
}
