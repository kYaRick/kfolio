using Microsoft.JSInterop;

namespace kfolio.Services;

public sealed class ThemeService
{
    private readonly IJSRuntime _jsRuntime;

    public ThemeService(IJSRuntime jsRuntime) =>
        _jsRuntime = jsRuntime;

    public async ValueTask SetAsync(string? theme)
    {
        try
        {
            await _jsRuntime.InvokeVoidAsync("kfolioTheme.set", theme);
        }
        catch (JSException)
        {
        }
    }

    public async ValueTask<string?> GetAsync()
    {
        try
        {
            return await _jsRuntime.InvokeAsync<string?>("kfolioTheme.get");
        }
        catch (JSException)
        {
            return null;
        }
    }
}