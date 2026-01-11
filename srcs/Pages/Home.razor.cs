namespace kfolio.Pages;

public partial class Home
{
    private string currentTheme = "dark";

    protected override async Task OnInitializedAsync()
    {
        var savedTheme = await ThemeService.GetAsync();
        if (!string.IsNullOrEmpty(savedTheme))
        {
            currentTheme = savedTheme;
        }
    }

    private async Task SetTheme(string theme)
    {
        currentTheme = theme;
        await ThemeService.SetAsync(theme);
    }

    private static class CvData
    {
        public static string Name = "Yaroslav Kyliushyk";
        public static string Title = "Sr Software Tool Engineer at Renesas Electronics";
        public static string Email = "kyarick@duck.com";
        public static string Telegram = "t.me/kYaRick";
        public static string LinkedIn = "linkedin.com/in/kyarick";
        public static string GitHub = "github.com/kYaRick";
        public static string Location = "Lviv, Ukraine";

        public static string Summary = "Sr Software Tool Engineer experienced in .NET, AvaloniaUI, MAUI, and Embedded systems. Focus on cross-platform solutions, DevOps (virtualization/containers), and hardware interaction.";

        public static Dictionary<string, string> TechPalette = new()
        {
            { "C#/.NET", "135deg, #512bd4, #9d4edd" },
            { "AvaloniaUI", "135deg, #f4a261, #e76f51" },
            { "Blazor", "135deg, #5c2d91, #b31b1b" },
            { "MAUI", "135deg, #512bd4, #4895ef" },
            { "WPF", "135deg, #00b4d8, #0077b6" },
            { "Microservices", "135deg, #2a9d8f, #264653" },
            { "PowerShell", "135deg, #264653, #2a9d8f" },
            { "WSL/Virtualization", "135deg, #e9c46a, #f4a261" },
            { "Unit Testing", "135deg, #A5C05B, #738A3F" },
            { "CI/CD", "135deg, #e76f51, #d62828" },
            { "GoLang (Basic)", "135deg, #00ebd3, #0077b6" },
            { "Home Assistant", "135deg, #03a9f4, #0277bd" },
            { "Microcontrollers", "135deg, #606c38, #283618" },
            { "Bash", "135deg, #2b2d42, #8d99ae" },
            { "Software Architecture", "135deg, #457b9d, #1d3557" },
            { "Postman", "135deg, #ff6c37, #ef5b25" },
            { "Swagger", "135deg, #85ea2d, #174716" },
            { "Gitlab", "135deg, #fc6d26, #e24329" },
            { "GreenPAK", "135deg, #70e000, #38b000" },
            { "Visual Programming", "135deg, #9d4edd, #5a189a" }
        };

        public static string GetColor(string tech) =>
            $"linear-gradient({(TechPalette.TryGetValue(tech, out var color) ? color : "135deg, #6c757d, #343a40")})";

        public static List<string> Skills = new()
        {
            "C#/.NET", "AvaloniaUI", "MAUI", "WPF", "Microservices",
            "PowerShell", "WSL/Virtualization", "Unit Testing", "CI/CD",
            "GoLang (Basic)", "Home Assistant"
        };

        public static List<string> Interests = new()
        {
            "Cycling", "Running", "Climbing", "Open-source contribution", "Home Assistant automation"
        };

        public static List<LanguageItem> Languages = new()
        {
            new() { Name = "Ukraine", Level = "Native", Flag = "🇺🇦" },
            new() { Name = "English", Level = "B2", Flag = "🇬🇧" }
        };

        public static List<EducationItem> Education = new()
        {
            new() { Year = "2024", Degree = "Master's, Computer Science", Institution = "Ukrainian Academy of Printing" },
            new() { Year = "2022", Degree = "Bachelor's, Computer Science", Institution = "Ivan Franko National University of Lviv" }
        };

        public static List<JobItem> Experience = new()
        {
            new()
            {
                Company = "Renesas Electronics",
                Role = "Sr Application and Software Tool Engineer",
                Period = "August 2023 - Present",
                Duties = new()
                {
                    "Technical documentation generation product support (calculating delay blocks).",
                    "Migration to new platforms ensuring relevance.",
                    "Code review, unit testing, and CI/CD support."
                },
                TechStack = new() { "AvaloniaUI", "Blazor", "MAUI", "WPF", "Microservices" }
            },
            new()
            {
                Company = "FORGE.AI",
                Role = "QA Engineer",
                Period = "June 2023 - May 2024",
                Duties = new()
                {
                    "AI UI Client Testing (GPT-4, Gemini Pro).",
                    "Platform Migration and Feature Development.",
                    "Microservices and API testing (Postman, Swagger)."
                },
                TechStack = new() { "Microservices", "Postman", "Swagger", "Gitlab" }
            },
            new()
            {
                Company = "Renesas Electronics",
                Role = "Application Engineer (ESE)",
                Period = "August 2021 - August 2023",
                Duties = new()
                {
                    "Support of technical documentation generation tools.",
                    "Adding new functionality to existing projects.",
                    "Version control system support."
                },
                TechStack = new() { "WPF", ".NET", "Microcontrollers", "Bash", "Software Architecture" }
            },
             new()
            {
                Company = "Lviv IT Cluster",
                Role = "Mentor",
                Period = "Dec 2023 - Present",
                Duties = new() { "Mentoring and self-employed activities." },
                TechStack = new() { }
            },
            new()
            {
                Company = "Dialog Semiconductor",
                Role = "Junior Application Engineer",
                Period = "April 2021 - August 2021",
                Duties = new()
                {
                    "Visual programming for GreenPAK products.",
                    "Hardware development support and client communication."
                },
                TechStack = new() { "GreenPAK", "Visual Programming" }
            }
        };
    }

    public class JobItem
    {
        public string Company { get; set; }
        public string Role { get; set; }
        public string Period { get; set; }
        public List<string> Duties { get; set; }
        public List<string> TechStack { get; set; }
    }

    public class LanguageItem
    {
        public string Name { get; set; }
        public string Level { get; set; }
        public string Flag { get; set; }
    }

    public class EducationItem
    {
        public string Year { get; set; }
        public string Degree { get; set; }
        public string Institution { get; set; }
    }
}
