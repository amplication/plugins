import { dotnetTypes } from "@amplication/code-gen-types";
import { CodeBlock, CsharpSupport } from "@amplication/csharp-ast";
import { getPluginSettings } from "../utils";

export function CreateSeedDevelopmentDataBody(
  resourceName: string,
  context: dotnetTypes.DsgContext
): CodeBlock {
  const { seedUserEmail, seedUserPassword } = getPluginSettings(
    context.pluginInstallations
  );

  return new CodeBlock({
    references: [
      CsharpSupport.classReference({
        name: "Identity",
        namespace: "Microsoft.AspNetCore.Identity",
      }),
      CsharpSupport.classReference({
        name: "EntityFrameworkCore",
        namespace: "Microsoft.AspNetCore.Identity.EntityFrameworkCore",
      }),
      CsharpSupport.classReference({
        name: resourceName,
        namespace: `${resourceName}.Infrastructure`,
      }),
    ],
    code: `
      var context = serviceProvider.GetRequiredService<${resourceName}DbContext>();
      var userStore = new UserStore<IdentityUser>(context);
      var usernameValue = "${seedUserEmail}";
      var passwordValue = "${seedUserPassword}";

      var existingUser = await userStore.FindByEmailAsync(usernameValue);
      if (existingUser != null)
      {
        return;
      }
         
      var user = new IdentityUser
      {
          Email = usernameValue,
          UserName = usernameValue,
          NormalizedUserName = usernameValue.ToUpperInvariant(),
          NormalizedEmail = usernameValue.ToUpperInvariant(),
      };
      var password = new PasswordHasher<IdentityUser>();
      var hashed = password.HashPassword(user, passwordValue);
      user.PasswordHash = hashed;
      await userStore.CreateAsync(user);
      
      var amplicationRoles = configuration
          .GetSection("AmplicationRoles")
          .AsEnumerable()
          .Where(x => x.Value != null)
          .Select(x => x.Value.ToString())
          .ToArray();
      var _roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
      foreach (var role in amplicationRoles)
      {
          await userStore.AddToRoleAsync(user, _roleManager.NormalizeKey(role));
      }
      
      await context.SaveChangesAsync();`,
  });
}
