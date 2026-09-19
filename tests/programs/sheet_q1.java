class Main {
  public static void main(String[] args) {
    int a = 8;
    int b = 5;
    System.out.println(a);
    System.out.println(b);
    a += b;
    b = a - b * 2;
    System.out.println(a);
    System.out.println(b);
    a = a / 3 + b % 4;
    System.out.println(a);
    System.out.println(a == b);
  }
}
