class Main {
  public static void main(String[] args) {
    int x = 26;
    int y = 7;
    int z = 4;
    System.out.println(x + y * z);
    System.out.println((x + y) * z);
    System.out.println(x - y * z + x / z);
    System.out.println(x % y + z * y);
    y = x / y + z % y;
    System.out.println(y);
    z = x % z + y * 3;
    System.out.println(z);
    System.out.println(x + y * z - x / y);
  }
}
