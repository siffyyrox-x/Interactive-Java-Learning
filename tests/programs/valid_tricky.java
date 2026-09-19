public class Main {
  static int pick(int k) {
    switch (k) {
      case 1: return 10;
      default: return 20;
    }
  }
  static int loopReturn(int[] a) {
    for (int i = 0; i < a.length; i++) {
      if (a[i] < 0) return i;
    }
    return -1;
  }
  static int forever(int n) {
    while (true) {
      if (n > 100) return n;
      n *= 2;
    }
  }
  static String kind(int n) {
    if (n % 2 == 0) {
      return "even";
    } else {
      return "odd";
    }
  }
  public static void main(String[] args) {
    int x;
    int y = 4;
    if (y > 2) x = 1; else x = 2;
    System.out.println(x);
    int z;
    switch (y) { case 4: z = 40; break; default: z = 0; }
    System.out.println(z);
    int m;
    m = y > 3 ? 7 : 8;
    System.out.println(m + pick(1) + pick(5) + loopReturn(new int[]{3, -1}) + forever(3) + kind(7));
    final int LIMIT = 3;
    byte b = 10;
    short s = 300;
    char c = 65;
    char c2 = 'A' + 2;
    long big = 123;
    float f = 3;
    double d = 'a';
    System.out.println(LIMIT + " " + b + " " + s + " " + c + c2 + " " + big + " " + f + " " + d);
    int count = 0;
    for (;;) { count++; if (count == 3) break; }
    System.out.println(count);
    int w;
    do { w = 5; } while (false);
    System.out.println(w);
    if (true) { System.out.println("t"); }
    int q;
    boolean ok = (q = 5) > 3;
    System.out.println(ok + " " + q);
  }
}
