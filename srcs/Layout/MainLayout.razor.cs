using kfolio.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace kfolio.Layout;

public partial class MainLayout
{
    [Inject]
    private IJSRuntime JSRuntime { get; set; } = default!;

    [Inject]
    private ThemeService ThemeService { get; set; } = default!;

    private string? _theme;

    protected override async Task OnInitializedAsync() =>
        _theme = await ThemeService.GetAsync();

    private async Task ScrollToTop() =>
        await JSRuntime.InvokeVoidAsync("window.scrollTo", new { top = 0, behavior = "smooth" });
}
