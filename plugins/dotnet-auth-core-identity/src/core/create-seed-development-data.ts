import { CodeBlock, CsharpSupport } from "@amplication/csharp-ast";

export function CreateSeedDevelopmentDataBody(resourceName: string): CodeBlock {
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
    code: `var context = serviceProvider.GetRequiredService<${resourceName}DbContext>();
      var amplicationRoles = configuration
          .GetSection("AmplicationRoles")
          .AsEnumerable()
          .Where(x => x.Value != null)
          .Select(x => x.Value.ToString())
          .ToArray();

          var user = new IdentityUser { Email = "test@email.com", UserName = "admin" };
        
 
          var password = new PasswordHasher<IdentityUser>();
          var hashed = password.HashPassword(user, "P@ssw0rd!");
          user.PasswordHash = hashed;
          var userStore = new UserStore<IdentityUser>(context);
          await userStore.CreateAsync(user);
          var _roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
      
          foreach (var role in amplicationRoles)
          {
              await userStore.AddToRoleAsync(user, _roleManager.NormalizeKey(role));
          }
      
      
      await context.SaveChangesAsync();`,
  });
}
