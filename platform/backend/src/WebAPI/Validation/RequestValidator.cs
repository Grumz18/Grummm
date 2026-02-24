using System.ComponentModel.DataAnnotations;

namespace Platform.WebAPI.Validation;

public static class RequestValidator
{
    public static void Validate<T>(T request)
    {
        if (request is null)
        {
            throw new RequestValidationException(new Dictionary<string, string[]>
            {
                ["request"] = ["Request body is required."]
            });
        }

        var context = new ValidationContext(request);
        var results = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(request, context, results, validateAllProperties: true);

        if (isValid)
        {
            return;
        }

        var errors = results
            .GroupBy(
                r => r.MemberNames.FirstOrDefault() ?? "request",
                r => r.ErrorMessage ?? "Validation error")
            .ToDictionary(g => g.Key, g => g.Distinct().ToArray());

        throw new RequestValidationException(errors);
    }
}
