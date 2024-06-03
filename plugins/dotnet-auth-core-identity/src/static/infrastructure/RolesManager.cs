using Microsoft.AspNetCore.Identity;

namespace ServiceName;

public class RolesManager
{
    public static async Task SyncRoles(
        IServiceProvider serviceProvider,
        IConfiguration configuration
    )
    {
        var amplicationRoles = configuration
            .GetSection("AmplicationRoles")
            .AsEnumerable()
            .Where(x => x.Value != null)
            .Select(x => x.Value)
            .ToArray();

        var _roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        if (_roleManager != null)
        {
            foreach (var roleName in amplicationRoles)
            {
                if (string.IsNullOrWhiteSpace(roleName))
                {
                    continue;
                }
                IdentityRole? role = await _roleManager.FindByNameAsync(roleName);
                if (role == null)
                {
                    var results = await _roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }
        }
    }
}