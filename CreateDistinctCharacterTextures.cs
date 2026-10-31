using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class CreateDistinctCharacterTextures
{
    public static void Main(string[] args)
    {
        Console.WriteLine("=== REFINING 4 AUTHENTIC VIETNAMESE CHARACTER TEXTURES (FLAWLESS 100%) ===");

        string michelleSrc = "temp_michelle_img_2_Ch03_1001_Diffuse.png";
        string soldierSrc = "C:/Users/TruongAn_PC/.gemini/antigravity/brain/887e3043-f97e-4bca-ae48-23316c9c09d3/soldier_img_1_vanguard_vanguard_diffuse_tga.jpg";

        GenerateNuSinhAoDai(michelleSrc);
        GenerateCoGaiAoBaBa(michelleSrc);
        GenerateNamTriThucSuit(soldierSrc);
        GenerateNamAoDaiGam(soldierSrc);

        Console.WriteLine("=== ALL 4 TEXTURES REFINED FLAWLESSLY ===");
    }

    private static bool IsYellowFabric(Color c)
    {
        return (c.R > 75 && c.G > 65 && (c.R + c.G) > (c.B * 1.75f) && (c.R - c.B) > 18 && (c.G - c.B) > 18);
    }

    private static bool IsSkinTone(Color c)
    {
        return (c.R > 90 && c.G > 55 && c.B > 40 && c.R > c.G && c.G >= (c.B - 10) && (c.R - c.B) > 15 && !IsYellowFabric(c));
    }

    private static void GenerateNuSinhAoDai(string srcPath)
    {
        Console.WriteLine("[1/4] Generating Nữ Sinh Áo Dài Trắng...");
        using (Bitmap src = new Bitmap(srcPath))
        {
            Bitmap dst = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
            int w = src.Width;
            int h = src.Height;

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    Color p = src.GetPixel(x, y);

                    // 1. Yellow Pants Check (Highest priority to eliminate any yellow patch)
                    if (IsYellowFabric(p))
                    {
                        float luma = (0.299f * p.R + 0.587f * p.G + 0.114f * p.B) / 255.0f;
                        int v = (int)(236 + luma * 18);
                        v = Math.Min(255, Math.Max(225, v));
                        dst.SetPixel(x, y, Color.FromArgb(v, v, (int)(v * 0.98f)));
                        continue;
                    }

                    // 2. Preserve Face, Lips, Eyes, Ears, Hair:
                    bool isFaceOrHead = (x > w * 0.68 && y < h * 0.36);
                    if (isFaceOrHead)
                    {
                        dst.SetPixel(x, y, p);
                        continue;
                    }

                    // 3. Preserve Skin (Arms, Hands, Fingers):
                    bool isArmOrHandSkin = (x > w * 0.58 && IsSkinTone(p));
                    if (isArmOrHandSkin)
                    {
                        dst.SetPixel(x, y, p);
                        continue;
                    }

                    // 4. Red Sneaker accents and trims -> white flats/shoes
                    bool isRedAccent = (p.R > 130 && p.G < 75 && p.B < 75);
                    if (isRedAccent)
                    {
                        dst.SetPixel(x, y, Color.FromArgb(235, 235, 238));
                        continue;
                    }

                    // 5. All other clothing / jacket / crop top -> Pure White Silk Áo Dài
                    float lumaSilk = (0.299f * p.R + 0.587f * p.G + 0.114f * p.B) / 255.0f;
                    int vSilk = (int)(242 + lumaSilk * 13);
                    vSilk = Math.Min(255, Math.Max(230, vSilk));
                    dst.SetPixel(x, y, Color.FromArgb(vSilk, vSilk, (int)(vSilk * 0.99f)));
                }
            }

            dst.Save("assets/characters/texture_nu_sinh_ao_dai.png", ImageFormat.Png);
            dst.Save("assets/textures/texture_nu_sinh_ao_dai.png", ImageFormat.Png);
        }
    }

    private static void GenerateCoGaiAoBaBa(string srcPath)
    {
        Console.WriteLine("[2/4] Generating Cô Gái Áo Bà Ba Hồng & Quần Đen...");
        using (Bitmap src = new Bitmap(srcPath))
        {
            Bitmap dst = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
            int w = src.Width;
            int h = src.Height;

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    Color p = src.GetPixel(x, y);

                    // 1. Yellow Pants -> Deep Silk Black Pants (Quần Lãnh Đen)
                    if (IsYellowFabric(p))
                    {
                        float luma = (0.299f * p.R + 0.587f * p.G + 0.114f * p.B) / 255.0f;
                        int v = (int)(24 + luma * 22);
                        dst.SetPixel(x, y, Color.FromArgb(v, v, (int)(v * 1.05f)));
                        continue;
                    }

                    // 2. Preserve Face, Lips, Eyes, Ears, Hair:
                    bool isFaceOrHead = (x > w * 0.68 && y < h * 0.36);
                    if (isFaceOrHead)
                    {
                        dst.SetPixel(x, y, p);
                        continue;
                    }

                    // 3. Preserve Skin (Arms, Hands, Fingers):
                    bool isArmOrHandSkin = (x > w * 0.58 && IsSkinTone(p));
                    if (isArmOrHandSkin)
                    {
                        dst.SetPixel(x, y, p);
                        continue;
                    }

                    // 4. Red Accents -> Dark wooden sandals
                    bool isRedAccent = (p.R > 130 && p.G < 75 && p.B < 75);
                    if (isRedAccent)
                    {
                        dst.SetPixel(x, y, Color.FromArgb(32, 28, 25));
                        continue;
                    }

                    // 5. Top Outfit -> Lotus Pink Silk Áo Bà Ba (#F06292)
                    float lumaBaBa = (0.299f * p.R + 0.587f * p.G + 0.114f * p.B) / 255.0f;
                    int r = (int)(245 * (0.85f + 0.25f * lumaBaBa));
                    int g = (int)(115 * (0.85f + 0.25f * lumaBaBa));
                    int b = (int)(155 * (0.85f + 0.25f * lumaBaBa));
                    r = Math.Min(255, Math.Max(185, r));
                    g = Math.Min(255, Math.Max(80, g));
                    b = Math.Min(255, Math.Max(115, b));

                    // Coconut button down the center of torso
                    if (x > w * 0.82 && x < w * 0.86 && y > h * 0.40 && y < h * 0.65)
                    {
                        dst.SetPixel(x, y, Color.FromArgb(40, 26, 18));
                    }
                    else
                    {
                        dst.SetPixel(x, y, Color.FromArgb(r, g, b));
                    }
                }
            }

            dst.Save("assets/characters/texture_co_gai_ao_ba_ba.png", ImageFormat.Png);
            dst.Save("assets/textures/texture_co_gai_ao_ba_ba.png", ImageFormat.Png);
        }
    }

    private static void GenerateNamTriThucSuit(string srcPath)
    {
        Console.WriteLine("[3/4] Generating Nam Trí Thức Suit...");
        using (Bitmap src = new Bitmap(srcPath))
        {
            Bitmap dst = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
            int w = src.Width;
            int h = src.Height;

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    Color p = src.GetPixel(x, y);

                    bool isChestV = (x > w * 0.45 && x < w * 0.55 && y > h * 0.16 && y < h * 0.28);
                    bool isTie = isChestV && (x > w * 0.49 && x < w * 0.51);
                    bool isVisor = (x < w * 0.20 && y < h * 0.25);

                    if (isTie)
                    {
                        dst.SetPixel(x, y, Color.FromArgb(125, 20, 36));
                    }
                    else if (isChestV)
                    {
                        dst.SetPixel(x, y, Color.FromArgb(250, 250, 252));
                    }
                    else if (isVisor)
                    {
                        dst.SetPixel(x, y, Color.FromArgb(28, 30, 36));
                    }
                    else
                    {
                        float luma = (0.299f * p.R + 0.587f * p.G + 0.114f * p.B) / 255.0f;
                        int val = (int)(42 + luma * 36);
                        val = Math.Min(110, Math.Max(30, val));
                        dst.SetPixel(x, y, Color.FromArgb(val, (int)(val * 1.02f), (int)(val * 1.08f)));
                    }
                }
            }

            dst.Save("assets/characters/texture_nam_tri_thuc_suit.png", ImageFormat.Png);
            dst.Save("assets/textures/texture_nam_tri_thuc_suit.png", ImageFormat.Png);
        }
    }

    private static void GenerateNamAoDaiGam(string srcPath)
    {
        Console.WriteLine("[4/4] Generating Nam Áo Dài Gấm...");
        using (Bitmap src = new Bitmap(srcPath))
        {
            Bitmap dst = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
            int w = src.Width;
            int h = src.Height;

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    Color p = src.GetPixel(x, y);

                    bool isGoldPattern = ((x % 48 < 6 && y % 48 < 6) || (Math.Abs((x % 48) - (y % 48)) <= 1 && (x % 96 < 48)));
                    bool isVisor = (x < w * 0.20 && y < h * 0.25);

                    if (isVisor)
                    {
                        dst.SetPixel(x, y, Color.FromArgb(22, 33, 62));
                    }
                    else if (isGoldPattern)
                    {
                        dst.SetPixel(x, y, Color.FromArgb(212, 175, 55));
                    }
                    else
                    {
                        float luma = (0.299f * p.R + 0.587f * p.G + 0.114f * p.B) / 255.0f;
                        int r = (int)(22 + luma * 22);
                        int g = (int)(34 + luma * 26);
                        int b = (int)(72 + luma * 48);
                        dst.SetPixel(x, y, Color.FromArgb(r, g, b));
                    }
                }
            }

            dst.Save("assets/characters/texture_nam_ao_dai_gam.png", ImageFormat.Png);
            dst.Save("assets/textures/texture_nam_ao_dai_gam.png", ImageFormat.Png);
        }
    }
}
