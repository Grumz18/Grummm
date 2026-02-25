namespace Platform.WebAPI.Contracts;

public static class AuthMappings
{
    public static LoginCommand ToCommand(LoginRequest request)
    {
        return new LoginCommand(
            UserName: request.UserName.Trim(),
            Password: request.Password);
    }
}

public sealed record LoginCommand(string UserName, string Password);
