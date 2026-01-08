using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Xml.Linq;
using System.Linq;
using System.IO;

// kfolio Build Script
// Run this from the project root with: dotnet scripts/build.cs

// Robust path detection
var rootPath = Directory.GetCurrentDirectory();
var propsFile = "Directory.Build.props";

if (!File.Exists(Path.Combine(rootPath, propsFile)))
{
    // If not found, try going up (in case we're inside /scripts)
    rootPath = Path.GetFullPath(Path.Combine(rootPath, ".."));
}

if (!File.Exists(Path.Combine(rootPath, propsFile)))
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine($"[!] Error: Could not find {propsFile} in {Directory.GetCurrentDirectory()} or parent.");
    Console.ResetColor();
    Environment.Exit(1);
}

var versionPropsPath = Path.Combine(rootPath, propsFile);
var versionProps = XDocument.Load(versionPropsPath);
var version = versionProps.Descendants("Version").First().Value;

var projectFile = Path.Combine(rootPath, "srcs/kfolio.csproj");
var configuration = "Release";
var outputPath = Path.Combine(rootPath, "artifacts");

// Check if we should skip the GitHub Pages patch (for local testing of artifacts)
bool isLocal = args.Contains("--local");

Console.WriteLine("======================================");
Console.WriteLine($"       kfolio Build Sandbox v{version}         ");
if (isLocal) Console.WriteLine("       [ LOCAL TEST BUILD ]           ");
Console.WriteLine("======================================");

try 
{
    Step("Cleaning up old artifacts...", "dotnet", $"clean {projectFile}");
    Step("Restoring dependencies...", "dotnet", $"restore {projectFile}");
    Step("Building and Publishing project...", "dotnet", $"publish {projectFile} -c {configuration} -o {outputPath} -p:Version={version} --no-restore");

    var wwwroot = Path.Combine(outputPath, "wwwroot");

    if (isLocal)
    {
        Console.WriteLine("\n[*] Local build requested. Skipping GitHub Pages maneuvers.");
    }
    else
    {
        Console.WriteLine("\n[*] Applying GitHub Pages maneuvers...");
        
        // 1. Add .nojekyll to allow folders starting with underscore (like _framework)
        File.WriteAllText(Path.Combine(wwwroot, ".nojekyll"), "");
        Console.WriteLine(" - [OK] Created .nojekyll");

        // 2. Copy index.html to 404.html for SPA routing support
        var indexPath = Path.Combine(wwwroot, "index.html");
        if (File.Exists(indexPath))
        {
            Console.WriteLine("\n[PATCH] Updating index.html for GitHub Pages...");
            var indexContent = File.ReadAllText(indexPath);
            
            // Use regex to handle any whitespace or quote variations
            var baseHrefPattern = @"<base\s+href=[""']\/[""']\s*\/?>";
            var newBaseHref = "<base href=\"/kfolio/\" />";

            if (System.Text.RegularExpressions.Regex.IsMatch(indexContent, baseHrefPattern))
            {
                indexContent = System.Text.RegularExpressions.Regex.Replace(indexContent, baseHrefPattern, newBaseHref);
                Console.WriteLine(" - [OK] Patched <base href> to /kfolio/");
            }

            File.WriteAllText(indexPath, indexContent);
            File.Copy(indexPath, Path.Combine(wwwroot, "404.html"), true);
            Console.WriteLine(" - [OK] Created 404.html");
        }
    }
    
    Console.WriteLine($"\n[SUCCESS] Everything looks great! Your static site is ready in the '{wwwroot}/' folder.");
}
catch (Exception ex)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine($"\n[FAILED] Build failed: {ex.Message}");
    Console.ResetColor();
    Environment.Exit(1);
}

void Step(string message, string command, string args)
{
    Console.WriteLine($"\n>> {message}");
    Console.ForegroundColor = ConsoleColor.DarkGray;
    Console.WriteLine($"> {command} {args}");
    Console.ResetColor();

    var psi = new ProcessStartInfo
    {
        FileName = command,
        Arguments = args,
        UseShellExecute = false,
        CreateNoWindow = false
    };

    using var process = Process.Start(psi);
    process?.WaitForExit();

    if (process?.ExitCode != 0)
    {
        throw new Exception($"Command '{command} {args}' exited with code {process?.ExitCode}");
    }
}
